from datetime import timedelta

from rest_framework_simplejwt.authentication import JWTAuthentication as BaseJWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

from apps.settings_app.models import SystemSetting


class JWTAuthentication(BaseJWTAuthentication):
    """Hook point for auth customization; behaves as simplejwt's default for now."""


def _configured_session_timeout_minutes():
    setting = SystemSetting.objects.filter(key="security.session_timeout_minutes").first()
    if setting and setting.value:
        try:
            return int(setting.value)
        except (TypeError, ValueError):
            pass
    return None


def _resolve_role_slugs(user):
    if user.is_superadmin:
        return []
    return list(user.user_roles.select_related("role").values_list("role__slug", flat=True))


def _resolve_perms_version(user):
    from apps.rbac.permissions import get_perms_version

    return get_perms_version(user)


def issue_tokens_for_user(user):
    """
    Builds a refresh+access token pair carrying the custom claims the spec
    requires (user_type, is_superadmin, roles, perms_version), and returns
    the refresh token's jti so the caller can record a UserSession row.
    """
    refresh = RefreshToken.for_user(user)

    claims = {
        "user_type": user.user_type,
        "is_superadmin": user.is_superadmin,
        "roles": _resolve_role_slugs(user),
        "perms_version": _resolve_perms_version(user),
    }
    for key, value in claims.items():
        refresh[key] = value

    access = refresh.access_token
    for key, value in claims.items():
        access[key] = value
    # Users & Security's "session timeout" setting, applied live to each
    # issued token — no redeploy needed for a policy change to take effect.
    timeout_minutes = _configured_session_timeout_minutes()
    if timeout_minutes:
        access.set_exp(lifetime=timedelta(minutes=timeout_minutes))
    # lets a request identify which UserSession (keyed by refresh jti) issued
    # the access token that authenticated it, e.g. for "current session" flags
    access["refresh_jti"] = refresh["jti"]

    return {
        "refresh": str(refresh),
        "access": str(access),
        "refresh_jti": refresh["jti"],
    }
