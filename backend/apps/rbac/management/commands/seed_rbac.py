from django.core.management.base import BaseCommand

from apps.rbac.seed import run


class Command(BaseCommand):
    help = "Seeds the permission registry and default system roles."

    def handle(self, *args, **options):
        perms_created, roles_created = run()
        self.stdout.write(self.style.SUCCESS(
            f"Seeded {perms_created} new permission(s) and {roles_created} new role(s)."
        ))
