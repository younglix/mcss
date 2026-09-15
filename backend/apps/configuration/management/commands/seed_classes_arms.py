from django.core.management.base import BaseCommand

from apps.configuration.models import ClassArm, SchoolClass

# Real classes and arms pulled from the legacy system
# (data_migration/phase3_config/class_arms.json, read-only extraction,
# 2026-09-10). The legacy system's "Withdrawn" and "New Students"
# pseudo-classes are deliberately excluded: they aren't real grade levels,
# and this app already has a proper home for that concept
# (Student.status: withdrawn / pending), so importing them as fake
# SchoolClass rows would just pollute the real list.
# (name, level_order, [arm names])
CLASSES = [
    ("KG-1", 1, ["A", "B", "C"]),
    ("KG-2", 2, ["A", "B", "C"]),
    ("Basic-1", 3, ["A", "B", "C"]),
    ("Basic-2", 4, ["A", "B", "C"]),
    ("Basic-3", 5, ["A", "B", "C"]),
    ("Basic-4", 6, ["A", "B", "C"]),
    ("Basic-5", 7, ["A", "B", "C"]),
    ("Basic-6", 8, ["A", "B", "C"]),
    ("Basic-7", 9, ["A", "B", "C"]),
    ("Basic-8", 10, ["A", "B", "C"]),
    ("Basic-9", 11, ["A", "B", "C"]),
    ("SS-1", 12, ["A", "B", "C"]),
    ("SS-2", 13, ["A", "B", "C"]),
    ("SS-3", 14, ["A", "B"]),
]

# Every class not on this list still gets an N_S holding arm (so new intake
# always has somewhere to land, see apps.finance.models._place_in_holding_arm)
# and a ClassBandingConfig row — just with `enabled=False`, matching this
# engine's own "nursery/KG classes have no config" default-off design. Only
# the unambiguous senior-secondary classes are turned on out of the box;
# a Super Admin can flip banding on for any other class (JSS/Basic) from the
# new Class-Arm Banding admin screen.
BANDING_ENABLED_BY_DEFAULT = {"SS-1", "SS-2", "SS-3"}
HOLDING_ARM_NAME = "N_S"


class Command(BaseCommand):
    help = "Seeds the real classes/arms pulled from the legacy system (safe to run on every deploy — only creates rows that don't exist yet)."

    def handle(self, *args, **options):
        from apps.academics.models import ClassBandingConfig

        classes_created = 0
        arms_created = 0
        configs_created = 0
        for name, level_order, arms in CLASSES:
            school_class, was_created = SchoolClass.objects.get_or_create(name=name, defaults={"level_order": level_order})
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
