from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db.models import Q
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "email", "phone", "identifier", "user_type", "full_name",
            "avatar", "two_factor_enabled", "last_login_at", "created_at",
        ]
        read_only_fields = fields


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
