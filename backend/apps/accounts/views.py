import logging
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.crypto import get_random_string
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from apps.audit.models import LoginHistory
from apps.audit.services import client_ip, log, user_agent
from apps.notifications.services import dispatch
from apps.rbac.permissions import HasPermission, get_effective_permissions
from apps.settings_app.models import SystemSetting
from common.responses import failure, success

from .authentication import issue_tokens_for_user
from .models import OTPChallenge, UserSession
from .serializers import (
    Enable2FASerializer,
    LoginSerializer,
    PasswordChangeSerializer,
    PasswordForgotSerializer,
    PasswordResetSerializer,
    RefreshSerializer,
    UserAdminSerializer,
    UserCreateSerializer,
    UserSerializer,
    VerifyOTPSerializer,
)
from .tasks import send_otp_email, send_otp_sms

User = get_user_model()


def _build_auth_payload(user, request):
    tokens = issue_tokens_for_user(user)
    UserSession.objects.create(
        user=user,
        refresh_token_jti=tokens["refresh_jti"],
        ip_address=client_ip(request),
        user_agent=user_agent(request)[:300],
    )
    user.last_login_at = timezone.now()
    user.save(update_fields=["last_login_at"])
    LoginHistory.objects.create(
        user=user, successful=True,
        ip_address=client_ip(request), user_agent=user_agent(request)[:300],
    )
    return {
        "access": tokens["access"],
        "refresh": tokens["refresh"],
        "user": UserSerializer(user).data,
        "permissions": sorted(get_effective_permissions(user)),
        # Role slugs, not just flattened permissions — Login.jsx needs these
        # to route staff accounts to the right portal (e.g. Teacher vs the
        # generic Admin dashboard), since a Principal's permission set is a
        # superset of a Teacher's and can't be told apart from permissions
        # alone.
        "roles": [] if user.is_superadmin else list(user.user_roles.select_related("role").values_list("role__slug", flat=True)),
    }


def _security_setting(key, default):
    setting = SystemSetting.objects.filter(key=key).first()
    if setting is None or setting.value in (None, ""):
        return default
    return setting.value


def _is_locked_out(user):
    """Rolling-window lockout: too many failed attempts within the last
    `lockout_duration_minutes` blocks login, and lifts on its own as old
    failures age out of the window — no extra "locked_until" field needed,
    LoginHistory (already recorded on every attempt) is the source of truth."""
    max_attempts = int(_security_setting("security.max_login_attempts", 5))
    if max_attempts <= 0:
        return False
    window_minutes = int(_security_setting("security.lockout_duration_minutes", 15))
    since = timezone.now() - timedelta(minutes=window_minutes)
    recent_failures = LoginHistory.objects.filter(user=user, successful=False, created_at__gte=since).count()
    return recent_failures >= max_attempts


def _maybe_alert_on_lockout(user, request):
    if not _security_setting("security.notify_on_failed_login", True):
        return
    try:
        dispatch(
            recipient=user,
            title="Security alert: account locked",
            body=f"Your account was temporarily locked after too many failed login attempts from {client_ip(request) or 'an unknown IP'}.",
            category="security",
        )
    except Exception:
        # Never let a notification-delivery failure break the lockout
        # response itself — the account is still locked either way.
        logging.getLogger(__name__).exception("Failed to dispatch lockout security alert for user %s.", user.id)


def _generate_otp():
    return get_random_string(length=settings.OTP_LENGTH, allowed_chars="0123456789")


def _create_challenge(user, purpose):
    code = _generate_otp()
    challenge = OTPChallenge.objects.create(
        user=user,
        purpose=purpose,
        expires_at=timezone.now() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES),
    )
    challenge.set_code(code)
    challenge.save(update_fields=["code_hash"])
    if user.email:
        send_otp_email.delay(user.email, code)
    elif user.phone:
        send_otp_sms.delay(user.phone, code)
    return challenge


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        login_value = str(request.data.get("login", "")).strip()
        candidate = User.objects.filter(
            Q(email__iexact=login_value) | Q(identifier__iexact=login_value) | Q(phone=login_value)
        ).first()

        if candidate and _is_locked_out(candidate):
            return failure(
                message="This account is temporarily locked due to too many failed login attempts. Try again later.",
                status=423,
            )

        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            LoginHistory.objects.create(
                user=candidate, successful=False,
                ip_address=client_ip(request), user_agent=user_agent(request)[:300],
            )
            if candidate and _is_locked_out(candidate):
                _maybe_alert_on_lockout(candidate, request)
            return failure(message="Invalid credentials.", errors=serializer.errors, status=401)

        user = serializer.validated_data["user"]

        if user.two_factor_enabled:
            challenge = _create_challenge(user, OTPChallenge.Purpose.LOGIN_2FA)
            return success(
                message="Verification code sent.",
                data={"requires_2fa": True, "challenge_id": str(challenge.id)},
            )

        return success(message="Login successful.", data=_build_auth_payload(user, request))


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp"

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        challenge = OTPChallenge.objects.filter(
            id=serializer.validated_data["challenge_id"],
            purpose=OTPChallenge.Purpose.LOGIN_2FA,
        ).select_related("user").first()

        if challenge is None or not challenge.is_valid:
            return failure(message="This code has expired or is invalid.", status=400)

        if not challenge.check_code(serializer.validated_data["code"]):
            challenge.attempts += 1
            challenge.save(update_fields=["attempts"])
            return failure(message="Incorrect code.", status=400)

        challenge.consume()
        return success(message="Login successful.", data=_build_auth_payload(challenge.user, request))


class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            refresh = RefreshToken(serializer.validated_data["refresh"])
            old_jti = refresh["jti"]
            if settings.SIMPLE_JWT["ROTATE_REFRESH_TOKENS"]:
                refresh.set_jti()
                refresh.set_exp()
                refresh.set_iat()
                UserSession.objects.filter(refresh_token_jti=old_jti).update(refresh_token_jti=refresh["jti"])

            access = refresh.access_token
            for claim in ("user_type", "is_superadmin", "roles", "perms_version"):
                if claim in refresh:
                    access[claim] = refresh[claim]
            access["refresh_jti"] = refresh["jti"]
        except TokenError as exc:
            return failure(message="Invalid or expired refresh token.", errors=str(exc), status=401)

        return success(data={"access": str(access), "refresh": str(refresh)})


class LogoutView(APIView):
    def post(self, request):
        refresh_str = request.data.get("refresh")
        if refresh_str:
            try:
                token = RefreshToken(refresh_str)
                token.blacklist()
                UserSession.objects.filter(refresh_token_jti=token["jti"]).update(revoked_at=timezone.now())
            except TokenError:
                pass
        return success(message="Logged out.")


class MeView(APIView):
    def get(self, request):
        return success(data={
            "user": UserSerializer(request.user).data,
            "roles": [] if request.user.is_superadmin else list(
                request.user.user_roles.select_related("role").values_list("role__slug", flat=True)
            ),
            "permissions": sorted(get_effective_permissions(request.user)),
        })


class PasswordForgotView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = PasswordForgotSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        login = serializer.validated_data["login"].strip()
        user = User.objects.filter(
            Q(email__iexact=login) | Q(identifier__iexact=login) | Q(phone=login)
        ).first()

        # Always return success shape regardless of whether the account exists,
        # so this endpoint can't be used to enumerate registered logins.
        if user is not None:
            challenge = _create_challenge(user, OTPChallenge.Purpose.PASSWORD_RESET)
            return success(message="If that account exists, a reset code was sent.",
                            data={"challenge_id": str(challenge.id)})
        return success(message="If that account exists, a reset code was sent.")


class PasswordResetView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp"

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        challenge = OTPChallenge.objects.filter(
            id=serializer.validated_data["challenge_id"],
            purpose=OTPChallenge.Purpose.PASSWORD_RESET,
        ).select_related("user").first()

        if challenge is None or not challenge.is_valid:
            return failure(message="This code has expired or is invalid.", status=400)

        if not challenge.check_code(serializer.validated_data["code"]):
            challenge.attempts += 1
            challenge.save(update_fields=["attempts"])
            return failure(message="Incorrect code.", status=400)

        challenge.consume()
        user = challenge.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        log(actor=user, action="user.password_reset", target=user, request=request)
        return success(message="Password has been reset.")


class PasswordChangeView(APIView):
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        log(actor=request.user, action="user.password_change", target=request.user, request=request)
        return success(message="Password changed.")


class Enable2FAView(APIView):
    def post(self, request):
        serializer = Enable2FASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.user.two_factor_enabled = serializer.validated_data["enabled"]
        request.user.save(update_fields=["two_factor_enabled"])
        return success(message="Two-factor preference updated.", data={"two_factor_enabled": request.user.two_factor_enabled})


class SessionsView(APIView):
    def get(self, request):
        active_jtis = set(
            OutstandingToken.objects.filter(user=request.user)
            .exclude(id__in=BlacklistedToken.objects.values_list("token_id", flat=True))
            .values_list("jti", flat=True)
        )
        sessions = UserSession.objects.filter(user=request.user, revoked_at__isnull=True, refresh_token_jti__in=active_jtis)
        current_jti = request.auth.get("refresh_jti") if request.auth else None

        data = [
            {
                "id": str(s.id),
                "ip_address": s.ip_address,
                "user_agent": s.user_agent,
                "created_at": s.created_at,
                "last_used_at": s.last_used_at,
                "is_current": s.refresh_token_jti == current_jti,
            }
            for s in sessions
        ]
        return success(data=data)


class SessionRevokeView(APIView):
    def delete(self, request, session_id):
        session = UserSession.objects.filter(id=session_id, user=request.user, revoked_at__isnull=True).first()
        if session is None:
            return failure(message="Session not found.", status=404)

        for outstanding in OutstandingToken.objects.filter(jti=session.refresh_token_jti):
            BlacklistedToken.objects.get_or_create(token=outstanding)

        session.revoked_at = timezone.now()
        session.save(update_fields=["revoked_at"])
        return success(message="Session revoked.")


class UsersView(ListCreateAPIView):
    """
    Backs both Staff Management (?user_type=staff) and User Management
    (unfiltered) — one real CRUD surface instead of two parallel systems,
    since the backend has a single User model regardless of which admin
    screen is looking at it.
    """
    queryset = User.objects.filter(is_deleted=False).order_by("-created_at")
    search_fields = ["full_name", "email", "identifier", "phone"]
    filterset_fields = ["user_type", "is_active"]

    def get_permissions(self):
        code = "users.view" if self.request.method == "GET" else "users.create"
        return [HasPermission(code)]

    def get_serializer_class(self):
        return UserCreateSerializer if self.request.method == "POST" else UserAdminSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        log(actor=self.request.user, action="user.created", target=user, request=self.request)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return success(message="User created.", data=UserAdminSerializer(serializer.instance).data, status=201)


class UserDetailView(RetrieveUpdateDestroyAPIView):
    queryset = User.objects.filter(is_deleted=False)
    serializer_class = UserAdminSerializer

    def get_permissions(self):
        mapping = {"GET": "users.view", "PATCH": "users.edit", "PUT": "users.edit", "DELETE": "users.delete"}
        return [HasPermission(mapping[self.request.method])]

    def perform_update(self, serializer):
        user = serializer.save()
        log(actor=self.request.user, action="user.updated", target=user, request=self.request)

    def perform_destroy(self, instance):
        if instance.id == self.request.user.id:
            raise ValidationError("You cannot delete your own account.")
        log(actor=self.request.user, action="user.deleted", target=instance, request=self.request)
        instance.soft_delete()
        instance.is_active = False
        instance.save(update_fields=["is_active"])


class UserResetPasswordView(APIView):
    permission_classes = [HasPermission("users.reset_password")]

    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id, is_deleted=False)
        temp_password = get_random_string(length=12)
        user.set_password(temp_password)
        user.save(update_fields=["password"])
        log(actor=request.user, action="user.password_reset_by_admin", target=user, request=request)
        return success(message="Password reset.", data={"temporary_password": temp_password})
