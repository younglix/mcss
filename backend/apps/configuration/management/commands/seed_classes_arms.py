from django.core.management.base import BaseCommand

from apps.configuration.models import ClassArm, SchoolClass

# Real classes and arms pulled from the legacy system
# (data_migration/phase3_config/class_arms.json, read-only extraction,
# 2026-09-10). The legacy system's "Withdrawn" and "New Students"
# pseudo-classes are deliberately excluded: they aren't real grade levels,
# and this app already has a proper home for that concept
# (Student.status: withdrawn / pending), so importing them as fake
# SchoolClass rows would just pollute the real list.
#
# Senior Secondary's arms are NOT performance bands — by school convention
# A = Science, B = Arts, C = Commercial, a manually-assigned subject stream
# (see Category.SENIOR_SECONDARY). All three get a C arm for exactly that
# reason, including SS-3 (previously only had A/B).
# (name, level_order, category, [arm names])
Category = SchoolClass.Category
CLASSES = [
    ("KG-1", 1, Category.PRE_PRIMARY, ["A", "B", "C"]),
    ("KG-2", 2, Category.PRE_PRIMARY, ["A", "B", "C"]),
    ("Basic-1", 3, Category.PRIMARY, ["A", "B", "C"]),
    ("Basic-2", 4, Category.PRIMARY, ["A", "B", "C"]),
    ("Basic-3", 5, Category.PRIMARY, ["A", "B", "C"]),
    ("Basic-4", 6, Category.PRIMARY, ["A", "B", "C"]),
    ("Basic-5", 7, Category.PRIMARY, ["A", "B", "C"]),
    ("Basic-6", 8, Category.PRIMARY, ["A", "B", "C"]),
    ("Basic-7", 9, Category.JUNIOR_SECONDARY, ["A", "B", "C"]),
    ("Basic-8", 10, Category.JUNIOR_SECONDARY, ["A", "B", "C"]),
    ("Basic-9", 11, Category.JUNIOR_SECONDARY, ["A", "B", "C"]),
    ("SS-1", 12, Category.SENIOR_SECONDARY, ["A", "B", "C"]),
    ("SS-2", 13, Category.SENIOR_SECONDARY, ["A", "B", "C"]),
    ("SS-3", 14, Category.SENIOR_SECONDARY, ["A", "B", "C"]),
]

# Every class not on this list still gets an N_S holding arm (so new intake
# always has somewhere to land, see apps.finance.models._place_in_holding_arm)
# and a ClassBandingConfig row — just with `enabled=False`, matching this
# engine's own "nursery/KG classes have no config" default-off design.
# Banding is Junior-Secondary-only, hard-enforced (ClassBandingConfigSerializer
# rejects enabling it for anything else) — so only Basic-7/8/9 default on;
# Senior Secondary's arms are manually-assigned streams, not performance
# bands, and can never be turned on here.
BANDING_ENABLED_BY_DEFAULT = {"Basic-7", "Basic-8", "Basic-9"}
HOLDING_ARM_NAME = "N_S"


class Command(BaseCommand):
    help = "Seeds the real classes/arms pulled from the legacy system (safe to run on every deploy — only creates rows that don't exist yet)."

    def handle(self, *args, **options):
        from apps.academics.models import ClassBandingConfig

        classes_created = 0
        arms_created = 0
        configs_created = 0
        for name, level_order, category, arms in CLASSES:
            school_class, was_created = SchoolClass.objects.get_or_create(
                name=name, defaults={"level_order": level_order, "category": category},
            )
            classes_created += int(was_created)
            for arm_name in arms:
                _, arm_created = ClassArm.objects.get_or_create(school_class=school_class, name=arm_name)
                arms_created += int(arm_created)

            holding_arm, holding_created = ClassArm.objects.get_or_create(school_class=school_class, name=HOLDING_ARM_NAME)
            arms_created += int(holding_created)

            _, config_created = ClassBandingConfig.objects.get_or_create(
                school_class=school_class,
                defaults={"holding_arm": holding_arm, "enabled": name in BANDING_ENABLED_BY_DEFAULT},
            )
            configs_created += int(config_created)

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {classes_created} new class(es), {arms_created} new arm(s), and {configs_created} new banding config(s)."
        ))
