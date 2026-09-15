from django.core.management.base import BaseCommand

from apps.configuration.models import FeeCategory

RT = FeeCategory.RestrictionType

# (name, is_recurring, restriction_type, amount)
# Admission/Application Fee and Acceptance Fee are deliberately NOT listed
# here — they're already a separate, working mechanism (Invoice.Purpose +
# the finance.acceptance_fee_amount system setting, see
# apps.admissions.services.approve_application), not part of this catalog.
# Adding a same-named FeeCategory row alongside that would just create a
# second, inert "Acceptance Fee" an admin could confuse for the real one.
#
# `amount` is only ever used for a NON-recurring category (the flat price a
# student pays to self-purchase a one-off ticket, see
# apps.finance.views.PurchaseFeeItemView) — recurring categories are priced
# per class/session via FeeStructure instead, so amount is left null for
# those. The one-off amounts below are placeholders; a Super Admin can
# adjust every one of them from Fee Items in Settings.
CATEGORIES = [
    ("Student ID Card Fee", False, RT.NONE, 2000),
    ("Medical Registration Fee", False, RT.NONE, 3000),
    ("Tuition Fee", True, RT.ACTIVE_STUDENT, None),
    ("ICT/Technology Fee", True, RT.NONE, None),
    ("Library Fee", True, RT.LIBRARY, None),
    ("Laboratory Fee", True, RT.NONE, None),
    ("Practical Fee", True, RT.NONE, None),
    ("Sports Fee", True, RT.ACTIVITY, None),
    ("Cultural/Activity Fee", True, RT.ACTIVITY, None),
    ("Hostel Accommodation Fee", True, RT.HOSTEL, None),
    ("Certificate/Result Fee", False, RT.CERTIFICATE, 5000),
    ("Transcript Fee", False, RT.NONE, 10000),
    ("Native Wear", False, RT.NONE, 8000),
    ("Sport/House Wears", False, RT.NONE, 6000),
    ("Sweater/Cardigan Short Sleeve", False, RT.NONE, 7000),
    ("Sweater/Cardigan Long Sleeve", False, RT.NONE, 8000),
    ("School Shoes", False, RT.NONE, 10000),
    ("Shoe Socks", False, RT.NONE, 1500),
    ("Laboratory Coat", False, RT.NONE, 4000),
    ("Textbooks", False, RT.NONE, 15000),
    ("Exercise Books", False, RT.NONE, 3000),
    ("Stationery", False, RT.NONE, 2500),
    ("School Bus/Transport Fee", True, RT.TRANSPORT, None),
    ("Excursion Fee", False, RT.ACTIVITY, 5000),
    ("Inter-House Sports Fee", False, RT.ACTIVITY, 2000),
    ("Graduation Fee", False, RT.ACTIVITY, 10000),
    ("End-of-Year Party Fee", False, RT.ACTIVITY, 3000),
    ("Career Day Fee", False, RT.ACTIVITY, 2000),
    ("Extra Lessons Fee", True, RT.NONE, None),
]


class Command(BaseCommand):
    help = "Seeds the MCSS fee-item catalog with restriction types (safe to run on every deploy — only creates rows that don't exist yet, and never touches an existing row's fields)."

    def handle(self, *args, **options):
        created = 0
        for name, is_recurring, restriction_type, amount in CATEGORIES:
            _, was_created = FeeCategory.objects.get_or_create(
                name=name,
                defaults={"is_recurring": is_recurring, "restriction_type": restriction_type, "amount": amount},
            )
            created += int(was_created)
        self.stdout.write(self.style.SUCCESS(f"Seeded {created} new fee categor{'y' if created == 1 else 'ies'}."))
