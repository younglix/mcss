from django.db import models

from common.models import BaseModel


class Application(BaseModel):
    """A public admission application — deliberately separate from
    accounts.User/academics.Student: most applicants never become
    students, and the ones who do get a real account created at
    acceptance, not at first form submission.

    Only `level=secondary` applications ever get accepted/rejected —
    primary applications are view-only records for now (no downstream
    workflow exists yet for that level)."""

    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        UNDER_REVIEW = "under_review", "Under Review"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"

    class Level(models.TextChoices):
        PRIMARY = "primary", "Primary"
        SECONDARY = "secondary", "Secondary"

    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"

    class Religion(models.TextChoices):
        CHRISTIANITY = "christianity", "Christianity"
        ISLAM = "islam", "Islam"
        OTHERS = "others", "Others"

    reference_number = models.CharField(max_length=30, unique=True, editable=False)
    # Defaults to secondary (the only level with a downstream workflow) so
    # any pre-existing row from before this field existed backfills sanely
    # rather than needing an interactive migration prompt.
    level = models.CharField(max_length=10, choices=Level.choices, default=Level.SECONDARY)

    # Candidate — matches the paper form's "Candidate's Full Name" (3 parts).
    # surname/first_name default to "" like every other optional field here,
    # but that's just a safe DB backfill value — the real, always-on
    # requiredness for both is enforced explicitly in
    # PublicApplicationSubmitSerializer.validate(), not by the DB layer.
    surname = models.CharField(max_length=100, default="")
    first_name = models.CharField(max_length=100, default="")
    middle_name = models.CharField(max_length=100, blank=True, default="")
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True, default="")
    present_class = models.CharField(max_length=50, blank=True, default="")  # class at their CURRENT/previous school
    schools_attended = models.TextField(blank=True, default="")
    religion = models.CharField(max_length=20, choices=Religion.choices, blank=True, default="")
    religion_other = models.CharField(max_length=100, blank=True, default="")
    nationality = models.CharField(max_length=100, blank=True, default="")
    state_of_origin = models.CharField(max_length=100, blank=True, default="")

    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=20, blank=True, default="")
    address = models.TextField(blank=True, default="")  # child's/ward's address, if different from parents'

    # Guardian — has_guardian gates whether father/mother detail below is required
    has_guardian = models.BooleanField(default=True)
    guardian_name = models.CharField(max_length=150, blank=True, default="")
    guardian_phone = models.CharField(max_length=20, blank=True, default="")
    guardian_email = models.EmailField(blank=True, default="")

    father_name = models.CharField(max_length=150, blank=True, default="")
    father_occupation = models.CharField(max_length=150, blank=True, default="")
    father_phone = models.CharField(max_length=20, blank=True, default="")
    father_place_of_work = models.CharField(max_length=150, blank=True, default="")
    father_home_address = models.TextField(blank=True, default="")
    father_office_address = models.TextField(blank=True, default="")
    father_email = models.EmailField(blank=True, default="")

    mother_name = models.CharField(max_length=150, blank=True, default="")
    mother_occupation = models.CharField(max_length=150, blank=True, default="")
    mother_phone = models.CharField(max_length=20, blank=True, default="")
    mother_place_of_work = models.CharField(max_length=150, blank=True, default="")
    mother_home_address = models.TextField(blank=True, default="")
    mother_office_address = models.TextField(blank=True, default="")
    mother_email = models.EmailField(blank=True, default="")

    siblings_in_school = models.CharField(max_length=255, blank=True, default="")  # "Any sibling(s)/relative(s) in Mount Carmel School?"
    guardian_signature_name = models.CharField(max_length=150, blank=True, default="")  # typed e-signature standing in for the paper form's signature

    class_applying_for = models.ForeignKey(
        "configuration.SchoolClass", on_delete=models.SET_NULL, null=True, blank=True, related_name="applications"
    )
    previous_school = models.CharField(max_length=200, blank=True, default="")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUBMITTED)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="applications_reviewed"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)

    enrolled_student = models.OneToOneField(
        "academics.Student", on_delete=models.SET_NULL, null=True, blank=True, related_name="source_application"
    )

    class Meta(BaseModel.Meta):
        ordering = ["-submitted_at"]

    @property
    def full_name(self):
        parts = [self.surname, self.first_name, self.middle_name]
        return " ".join(p for p in parts if p)

    def __str__(self):
        return f"{self.reference_number} — {self.full_name}"


class ApplicationDocument(BaseModel):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="documents")
    title = models.CharField(max_length=150)
    file_url = models.URLField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta(BaseModel.Meta):
        ordering = ["uploaded_at"]

    def __str__(self):
        return f"{self.title} — {self.application.reference_number}"
