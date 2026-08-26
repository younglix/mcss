from django.core.exceptions import ValidationError

from apps.settings_app.models import SystemSetting

SECURITY_KEYS = [
    "security.password_min_length",
    "security.password_require_uppercase",
    "security.password_require_number",
    "security.password_require_symbol",
]


class ConfigurablePasswordValidator:
    """Reads the password policy from System & Config's Users & Security
    settings (group "security") at validation time, so changing the policy
    there takes effect immediately for every password entry point (staff
    creation, reset, change) without a redeploy."""

    def validate(self, password, user=None):
        settings_by_key = {s.key: s.value for s in SystemSetting.objects.filter(key__in=SECURITY_KEYS)}

        min_length = settings_by_key.get("security.password_min_length")
        min_length = int(min_length) if min_length else 8
        if len(password) < min_length:
            raise ValidationError(
                f"This password must contain at least {min_length} characters.",
                code="password_too_short_configured",
            )
        if settings_by_key.get("security.password_require_uppercase") and not any(c.isupper() for c in password):
            raise ValidationError("This password must contain at least one uppercase letter.", code="password_no_upper")
        if settings_by_key.get("security.password_require_number") and not any(c.isdigit() for c in password):
            raise ValidationError("This password must contain at least one number.", code="password_no_number")
        if settings_by_key.get("security.password_require_symbol") and not any(not c.isalnum() for c in password):
            raise ValidationError("This password must contain at least one symbol.", code="password_no_symbol")

    def get_help_text(self):
        return "Your password must meet the institution's configured password policy."
