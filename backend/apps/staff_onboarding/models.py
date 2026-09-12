from django.db import models

from common.models import BaseModel


class StaffApplication(BaseModel):
    """A public, self-service "create my staff account" submission — mirrors
    apps.admissions.Application's public-submit -> HR reviews -> approve ->
    real records created shape, but for existing staff onboarding
    themselves into the system rather than new student admissions. Nothing
    here becomes a real accounts.User (or, for non-academic staff, a real
    finance.NonAcademicStaffPayout) until an HR/Super Admin reviewer
    approves it — self-selecting a sensitive role (HR, Accountant) or
    claiming a class/subject someone else already owns both need a human to
    adjudicate, not a public form. See services.approve_staff_application."""

    class StaffType(models.TextChoices):
        PRINCIPAL = "principal", "Principal"
        TEACHER = "teacher", "Teacher"
        EXAM_OFFICER = "exam_officer", "Exam Officer"
        ACCOUNTANT = "accountant", "Accountant"
        HR = "hr", "HR"
        NON_ACADEMIC = "non_academic", "Non-Academic Staff"

    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        UNDER_REVIEW = "under_review", "Under Review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    class Sex(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"

    staff_type = models.CharField(max_length=20, choices=StaffType.choices)

    full_name = models.CharField(max_length=150)
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=20, blank=True, default="")
    sex = models.CharField(max_length=10, choices=Sex.choices, blank=True, default="")
    date_of_birth = models.DateField(null=True, blank=True)

    # Teacher-only: the form/class-teacher claim. Validated against
    # ClassTeacherAssignment's one-teacher-per-class-arm-per-session rule at
    # approval time, not here — a public submission can claim anything; a
    # human resolves any collision during review.
    is_form_teacher = models.BooleanField(default=False)
    form_teacher_class_arm = models.ForeignKey(
        "configuration.ClassArm", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    # Non-academic staff only — "Cleaner", "Driver", ... free text, mirrors
    # finance.NonAcademicStaffPayout.title exactly; that's where it lands.
    non_academic_role_title = models.CharField(max_length=100, blank=True, default="")

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUBMITTED)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="staff_applications_reviewed"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True, default="")

    # Set at approval — the real records this application became.
    created_user = models.OneToOneField(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="source_staff_application"
    )
    created_payout = models.OneToOneField(
        "finance.NonAcademicStaffPayout", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="source_staff_application",
    )

    class Meta(BaseModel.Meta):
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.full_name} ({self.get_staff_type_display()})"


class StaffApplicationSubjectClaim(BaseModel):
    """One "I teach <subject> in <class-arm>" line on a teacher's
    application — a teacher application carries as many of these as they
    like. Becomes a real academics.ClassSubjectAssignment at approval."""

    application = models.ForeignKey(StaffApplication, on_delete=models.CASCADE, related_name="subject_claims")
    subject = models.ForeignKey("academics.Subject", on_delete=models.CASCADE, related_name="+")
    class_arm = models.ForeignKey("configuration.ClassArm", on_delete=models.CASCADE, related_name="+")

    class Meta(BaseModel.Meta):
        ordering = ["class_arm__school_class__level_order", "class_arm__name", "subject__name"]

    def __str__(self):
        return f"{self.subject.name} — {self.class_arm}"


class StaffApplicationFieldValue(BaseModel):
    """One Super-Admin-defined custom field's answer on a pending
    application — NIN, Qualification, Account Number, or anything else the
    Super Admin has added for the "staff" entity in Forms & Custom Fields.
    There's no accounts.User yet to attach a real custom_fields.CustomFieldValue
    to, so answers live here until approval, when
    custom_fields.services.promote_pending_values() copies every row into a
    real CustomFieldValue for the newly created user — the exact same
    dynamic-field set the profile-edit screen renders, automatically,
    with no onboarding-specific field list to keep in sync by hand."""

    application = models.ForeignKey(StaffApplication, on_delete=models.CASCADE, related_name="field_values")
    field = models.ForeignKey("custom_fields.CustomField", on_delete=models.CASCADE, related_name="+")
    value = models.JSONField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["field__order", "field__label"]
        constraints = [
            models.UniqueConstraint(fields=["application", "field"], condition=models.Q(is_deleted=False), name="unique_active_application_field"),
        ]

    def __str__(self):
        return f"{self.field.label} @ {self.application_id}"
