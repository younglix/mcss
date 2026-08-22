from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from common.models import BaseModel
from common.validators import phone_validator

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    class UserType(models.TextChoices):
        STAFF = "staff", "Staff"
        STUDENT = "student", "Student"
        PARENT = "parent", "Parent"
        APPLICANT = "applicant", "Applicant"

    email = models.EmailField(unique=True, null=True, blank=True)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True, validators=[phone_validator])
    # login handle when not email — e.g. admission number
    identifier = models.CharField(max_length=50, unique=True, null=True, blank=True)

    user_type = models.CharField(max_length=20, choices=UserType.choices)
    full_name = models.CharField(max_length=150)
    avatar = models.URLField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superadmin = models.BooleanField(default=False)

    two_factor_enabled = models.BooleanField(default=False)
    last_login_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.email or self.identifier or self.phone or str(self.id)

    @property
    def login_handle(self):
        return self.email or self.identifier or self.phone


class OTPChallenge(BaseModel):
    class Purpose(models.TextChoices):
        LOGIN_2FA = "login_2fa", "Login 2FA"
        PASSWORD_RESET = "password_reset", "Password Reset"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="otp_challenges")
    purpose = models.CharField(max_length=20, choices=Purpose.choices, default=Purpose.LOGIN_2FA)
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)

    MAX_ATTEMPTS = 5

    def set_code(self, raw_code):
        self.code_hash = make_password(raw_code)

    def check_code(self, raw_code):
        return check_password(raw_code, self.code_hash)

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    @property
    def is_valid(self):
        return self.consumed_at is None and not self.is_expired and self.attempts < self.MAX_ATTEMPTS

    def consume(self):
        self.consumed_at = timezone.now()
        self.save(update_fields=["consumed_at"])


class UserSession(BaseModel):
    """
    Enriches simplejwt's OutstandingToken (which owns actual invalidation via
    the blacklist) with the device/IP metadata needed to show a human-readable
    active-sessions list and let a user revoke one from another device.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")
    refresh_token_jti = models.CharField(max_length=255, unique=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)
    last_used_at = models.DateTimeField(auto_now=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    @property
    def is_active(self):
        return self.revoked_at is None
