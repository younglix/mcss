import secrets

from django.db import models
from django.utils import timezone

from common.models import BaseModel


class QuestionBank(BaseModel):
    """One subject's question pool for one class, one term — teachers author
    into this; an Exam Officer approves it once it clears the minimum size
    (see services.can_approve_bank). A CBE Exam can only be configured off
    an *approved* bank (Exam.bank is PROTECTed and the config endpoint
    checks is_approved itself)."""

    subject = models.ForeignKey("academics.Subject", on_delete=models.CASCADE, related_name="question_banks")
    school_class = models.ForeignKey("configuration.SchoolClass", on_delete=models.CASCADE, related_name="question_banks")
    term = models.ForeignKey("configuration.Term", on_delete=models.CASCADE, related_name="question_banks")
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="question_banks_approved"
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        unique_together = ("subject", "school_class", "term")
        ordering = ["subject__name"]

    def __str__(self):
        return f"{self.subject.name} — {self.school_class.name} ({self.term.name})"

    def revoke_approval(self):
        """Any edit to an already-approved bank's questions calls this —
        no silent changes to an approved bank; it must be re-approved."""
        if self.is_approved:
            self.is_approved = False
            self.approved_by = None
            self.approved_at = None
            self.save(update_fields=["is_approved", "approved_by", "approved_at"])


class Question(BaseModel):
    OPTION_CHOICES = [("A", "A"), ("B", "B"), ("C", "C"), ("D", "D")]

    bank = models.ForeignKey(QuestionBank, on_delete=models.CASCADE, related_name="questions")
    text = models.TextField()
    option_a = models.CharField(max_length=500)
    option_b = models.CharField(max_length=500)
    option_c = models.CharField(max_length=500)
    option_d = models.CharField(max_length=500)
    correct_option = models.CharField(max_length=1, choices=OPTION_CHOICES)
    author = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="exam_questions_authored")

    class Meta(BaseModel.Meta):
        ordering = ["created_at"]

    def __str__(self):
        return self.text[:60]

    @property
    def options(self):
        return {"A": self.option_a, "B": self.option_b, "C": self.option_c, "D": self.option_d}


class Exam(BaseModel):
    """One CBE sitting — one subject, one class, drawn from one approved
    QuestionBank. Deliberately distinct from academics.Exam (a whole
    school exam *period*, e.g. "First Term Examination" spanning every
    subject/class): this is the narrower, subject+class-scoped CBE
    configuration the Exam Officer sets up and toggles live. `academic_exam`
    is how a graded sitting's score actually reaches the existing
    report-card/results-approval pipeline once it ends (see services.end_exam) —
    nothing new is invented for publishing; results.approve/results.publish
    on the linked academics.Exam still gate what a student/parent ever sees."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        ENDED = "ended", "Ended"

    title = models.CharField(max_length=200)
    academic_exam = models.ForeignKey(
        "academics.Exam", on_delete=models.CASCADE, related_name="cbe_sittings",
        help_text="The school-wide exam period this CBE sitting's score reports into.",
    )
    subject = models.ForeignKey("academics.Subject", on_delete=models.CASCADE, related_name="cbe_exams")
    school_class = models.ForeignKey("configuration.SchoolClass", on_delete=models.CASCADE, related_name="cbe_exams")
    class_arm = models.ForeignKey(
        "configuration.ClassArm", on_delete=models.SET_NULL, null=True, blank=True, related_name="cbe_exams",
        help_text="Blank runs the sitting for every arm of school_class.",
    )
    bank = models.ForeignKey(QuestionBank, on_delete=models.PROTECT, related_name="exams")

    questions_per_student = models.PositiveIntegerField(default=50)
    duration_minutes = models.PositiveIntegerField(default=30)
    auto_submit_penalty = models.PositiveIntegerField(default=5)
    total_marks = models.PositiveIntegerField(default=50)

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    access_code = models.CharField(max_length=12, null=True, blank=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="cbe_exams_configured"
    )

    class Meta(BaseModel.Meta):
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.status})"

    def activate(self):
        self.status = self.Status.ACTIVE
        self.activated_at = timezone.now()
        # Fresh code every ON — dead the moment it's toggled off. The
        # student-facing login resolves an exam by code alone (nobody in a
        # hall is typing a UUID), so this must be unique among exams that
        # are ACTIVE *right now* — collision odds are astronomically low
        # with 8 hex chars, but the check is cheap enough to just make sure.
        code = secrets.token_hex(4).upper()
        while Exam.objects.filter(status=Exam.Status.ACTIVE, access_code=code).exists():
            code = secrets.token_hex(4).upper()
        self.access_code = code
        self.save(update_fields=["status", "activated_at", "access_code"])

    def end(self):
        self.status = self.Status.ENDED
        self.ended_at = timezone.now()
        self.access_code = None
        self.save(update_fields=["status", "ended_at", "access_code"])


class Attempt(BaseModel):
    class Status(models.TextChoices):
        IN_PROGRESS = "in_progress", "In Progress"
        SUBMITTED = "submitted", "Submitted"
        AUTO_SUBMITTED_TIMEOUT = "auto_submitted_timeout", "Auto-submitted (timeout)"
        AUTO_SUBMITTED_EXIT = "auto_submitted_exit", "Auto-submitted (left page)"
        RESET = "reset", "Reset"

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="attempts")
    student = models.ForeignKey("academics.Student", on_delete=models.CASCADE, related_name="cbe_attempts")
    question_ids = models.JSONField(default=list)   # the drawn subset, in this student's order
    answers = models.JSONField(default=dict)        # {question_id: "A".."D"}, autosaved
    started_at = models.DateTimeField(default=timezone.now)
    deadline = models.DateTimeField()
    submitted_at = models.DateTimeField(null=True, blank=True)
    raw_score = models.IntegerField(null=True, blank=True)
    penalty_applied = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=25, choices=Status.choices, default=Status.IN_PROGRESS)
    reset_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="cbe_attempts_reset"
    )
    reset_reason = models.CharField(max_length=255, blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["-started_at"]
        constraints = [
            # Only one *live* attempt per student per exam at a time — a
            # reset attempt is kept (not deleted) as history, so this can't
            # be a plain unique_together: it has to exclude reset rows.
            models.UniqueConstraint(
                fields=["exam", "student"], condition=~models.Q(status="reset"),
                name="examinations_attempt_one_live_per_exam_student",
            ),
        ]

    def __str__(self):
        return f"{self.student} — {self.exam.title} ({self.status})"
