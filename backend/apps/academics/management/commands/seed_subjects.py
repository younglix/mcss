from django.core.management.base import BaseCommand

from apps.academics.models import Subject

# Real subjects pulled from the legacy system (data_migration/phase2_subjects,
# read-only extraction, 2026-09-01). The legacy system's per-section
# JSS/SS/NTC abbreviations (e.g. MTH_J vs MTH_S for the same "Mathematics")
# collapse to one Subject row per distinct name here, since this app's
# Subject model has no section concept — "Comment" was the legacy grading
# system's teacher's-comment placeholder, not a real subject, and is
# deliberately excluded.
# (code, name) — code is the legacy abbreviation, kept as a stable short code.
SUBJECTS = [
    ("AGRIC_J", "Agricultural Science"),
    ("B_SC", "Basic Science"),
    ("B_TECH", "Basic Technology"),
    ("B_STUDS", "Business Studies"),
    ("CRS", "Christian Religious Studies"),
    ("CIVIC_J", "Civic Education"),
    ("COMP_J", "Computer Studies"),
    ("ENG_J", "English Studies"),
    ("Esan", "Esan"),
    ("CCA", "Fine Art"),
    ("French", "French"),
    ("HIS", "History"),
    ("H_ECONS", "Home Economics"),
    ("MTH_J", "Mathematics"),
    ("Music", "Music"),
    ("PHE", "Physical and Health Education"),
    ("SOS", "Social Studies"),
    ("BIO", "Biology"),
    ("CHM", "Chemistry"),
    ("COMP_S", "Computer Science"),
    ("DP", "Data Processing"),
    ("ECONS", "Economics"),
    ("ENG_S", "English Language"),
    ("ACCT", "Financial Accounting"),
    ("FOOD", "Foods and Nutrition"),
    ("FURTHER", "Further Mathematics"),
    ("GEO", "Geography"),
    ("GOVT", "Government"),
    ("LIT", "Literature in English"),
    ("PHY", "Physics"),
    ("Eng", "English"),
    ("Math", "Math"),
]


class Command(BaseCommand):
    help = "Seeds the real subjects pulled from the legacy system (safe to run on every deploy — only creates rows that don't exist yet)."

    def handle(self, *args, **options):
        created = 0
        for code, name in SUBJECTS:
            _, was_created = Subject.objects.get_or_create(name=name, defaults={"code": code})
            created += int(was_created)
        self.stdout.write(self.style.SUCCESS(f"Seeded {created} new subject(s)."))
