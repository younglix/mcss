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


class Command(BaseCommand):
    help = "Seeds the real classes/arms pulled from the legacy system (safe to run on every deploy — only creates rows that don't exist yet)."

    def handle(self, *args, **options):
        classes_created = 0
        arms_created = 0
        for name, level_order, arms in CLASSES:
            school_class, was_created = SchoolClass.objects.get_or_create(name=name, defaults={"level_order": level_order})
            classes_created += int(was_created)
            for arm_name in arms:
                _, arm_created = ClassArm.objects.get_or_create(school_class=school_class, name=arm_name)
                arms_created += int(arm_created)
        self.stdout.write(self.style.SUCCESS(f"Seeded {classes_created} new class(es) and {arms_created} new arm(s)."))
