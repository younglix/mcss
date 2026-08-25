from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db.models import Q
from rest_framework import serializers

User = get_user_model()


def _check_unique_active(attrs, *, exclude_id=None):
    """email/phone/identifier are only unique among is_deleted=False users
    (see the model's partial UniqueConstraints) — mirror that here since
    dropping the field-level unique=True also dropped DRF's auto-validator."""
    errors = {}
    for field in ("email", "phone", "identifier"):
        value = attrs.get(field)
        if not value:
            continue
        qs = User.objects.filter(is_deleted=False, **{field: value})
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        if qs.exists():
            errors[field] = [f"user with this {field} already exists."]
    if errors:
        raise serializers.ValidationError(errors)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "email", "phone", "identifier", "user_type", "full_name",
            "avatar", "two_factor_enabled", "last_login_at", "created_at",
        ]
        read_only_fields = fields


class UserAdminSerializer(serializers.ModelSerializer):
    """Listing/detail shape for Staff Management & User Management — never
    exposes is_superadmin, which stays a break-glass flag outside this API."""

    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "phone", "identifier", "user_type", "full_name",
            "avatar", "is_active", "two_factor_enabled", "last_login_at", "created_at", "roles",
        ]
        read_only_fields = ["id", "last_login_at", "created_at", "roles"]

    def get_roles(self, obj):
        return list(obj.user_roles.select_related("role").values_list("role__slug", flat=True))

    def validate(self, attrs):
        _check_unique_active(attrs, exclude_id=self.instance.id if self.instance else None)
        return attrs


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    role_ids = serializers.ListField(child=serializers.UUIDField(), required=False, write_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "phone", "identifier", "user_type", "full_name", "password", "role_ids"]

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        if not attrs.get("email") and not attrs.get("phone") and not attrs.get("identifier"):
            raise serializers.ValidationError("Provide at least one of email, phone, or identifier.")
        _check_unique_active(attrs)
        return attrs

    def create(self, validated_data):
        role_ids = validated_data.pop("role_ids", [])
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        if role_ids:
            from apps.rbac.models import PermissionsVersion, Role, UserRole

            roles = Role.objects.filter(id__in=role_ids)
            UserRole.objects.bulk_create([UserRole(user=user, role=role) for role in roles])
            PermissionsVersion.bump()
        return user


class LoginSerializer(serializers.Serializer):
    login = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        login = attrs["login"].strip()
        user = User.objects.filter(
            Q(email__iexact=login) | Q(identifier__iexact=login) | Q(phone=login)
        ).first()

        if user is None or not user.check_password(attrs["password"]) or not user.is_active:
            raise serializers.ValidationError({"login": "Invalid credentials."})

        attrs["user"] = user
        return attrs


class VerifyOTPSerializer(serializers.Serializer):
    challenge_id = serializers.UUIDField()
    code = serializers.CharField(max_length=6, min_length=6)


class RefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class PasswordForgotSerializer(serializers.Serializer):
    login = serializers.CharField()


class PasswordResetSerializer(serializers.Serializer):
    challenge_id = serializers.UUIDField()
    code = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_new_password(self, value):
        validate_password(value)
        return value


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        validate_password(value)
        return value


class Enable2FASerializer(serializers.Serializer):
    enabled = serializers.BooleanField()


class SessionSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    ip_address = serializers.IPAddressField(allow_null=True)
    user_agent = serializers.CharField()
    created_at = serializers.DateTimeField()
    last_used_at = serializers.DateTimeField()
    is_current = serializers.BooleanField()
