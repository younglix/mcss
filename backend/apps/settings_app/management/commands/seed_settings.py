from django.core.management.base import BaseCommand

from apps.settings_app.models import SystemSetting

# (key, group, default value, is_secret) — spec Section 7's example keys,
# seeded empty/off so Super Admin fills them in via PATCH once providers
# are chosen; the API intentionally has no "create setting" endpoint, so
# every key the app expects to read must exist from this seed.
DEFAULT_SETTINGS = [
    ("sms.provider", "sms", "", False),
    ("sms.sender_id", "sms", "", False),
    ("sms.api_key", "sms", "", True),
    ("email.host", "email", "", False),
    ("email.from", "email", "", False),
    ("email.password", "email", "", True),
    ("payments.paystack.public_key", "payments", "", False),
    ("payments.paystack.secret_key", "payments", "", True),
    ("payments.flutterwave.public_key", "payments", "", False),
    ("payments.flutterwave.secret_key", "payments", "", True),
    ("notifications.absentee_alert_enabled", "notifications", False, False),
    ("notifications.channels", "notifications", ["in_app"], False),
    ("numbering.admission_format", "numbering", "MC/{year}/{seq:04}", False),
    ("numbering.receipt_format", "numbering", "RCT/{year}/{seq:05}", False),
    ("numbering.invoice_format", "numbering", "INV/{year}/{seq:05}", False),
    ("result.pass_mark", "result", 50, False),
    ("result.show_position", "result", True, False),
    ("result.lock_after_publish", "result", True, False),
]


class Command(BaseCommand):
    help = "Seeds the default system-setting keys (empty/off) so PATCH/bulk endpoints have rows to update."

    def handle(self, *args, **options):
        created = 0
        for key, group, default_value, is_secret in DEFAULT_SETTINGS:
            if SystemSetting.objects.filter(key=key).exists():
                continue
            setting = SystemSetting(key=key, group=group, is_secret=is_secret)
            setting.set_value(default_value)
            setting.save()
            created += 1
        self.stdout.write(self.style.SUCCESS(f"Seeded {created} new setting(s)."))
