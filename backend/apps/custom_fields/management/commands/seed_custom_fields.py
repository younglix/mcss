from django.core.management.base import BaseCommand

from apps.custom_fields.models import CustomField

# (entity, key, label, is_sensitive, required) — needed by the self-service
# Staff Onboarding form (apps.staff_onboarding), which writes into these at
# approval time via the same masked-field display path that already covers
# bank account numbers. Both required per the original spec ("they will
# also be asked to provide their NIN number, qualification").
FIELDS = [
    ("staff", "nin", "NIN", True, True),
    ("staff", "qualification", "Qualification", False, True),
]


class Command(BaseCommand):
    help = "Seeds default custom fields the app expects to exist (safe to run on every deploy — only creates rows that don't exist yet)."

    def handle(self, *args, **options):
        created = 0
        for entity, key, label, is_sensitive, required in FIELDS:
            _, was_created = CustomField.objects.get_or_create(
                entity=entity, key=key,
                defaults={"label": label, "field_type": "text", "is_sensitive": is_sensitive, "required": required},
            )
            created += int(was_created)
        self.stdout.write(self.style.SUCCESS(f"Seeded {created} new custom field(s)."))
