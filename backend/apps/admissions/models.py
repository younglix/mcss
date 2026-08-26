from django.db import models

from common.models import BaseModel


class Application(BaseModel):
    """A public admission application — deliberately separate from
    accounts.User/academics.Student: most applicants never become
    students, and the ones who do get a real account created at
    acceptance, not at first form submission."""

    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        UNDER_REVIEW = "under_review", "Under Review"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"

    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"

    reference_number = models.CharField(max_length=30, unique=True, editable=False)
    full_name = models.CharField(max_length=150)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    guardian_name = models.CharField(max_length=150, blank=True)
    guardian_phone = models.CharField(max_length=20, blank=True)
    guardian_email = models.EmailField(blank=True)
    class_applying_for = models.ForeignKey(
        "configuration.SchoolClass", on_delete=models.SET_NULL, null=True, blank=True, related_name="applications"
    )
    previous_school = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUBMITTED)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="applications_reviewed"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["-submitted_at"]

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
