from django.db import models

from common.models import BaseModel


class Subject(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    department = models.ForeignKey(
        "configuration.Department", on_delete=models.SET_NULL, null=True, blank=True, related_name="subjects"
    )
    is_core = models.BooleanField(default=False)

    class Meta(BaseModel.Meta):
        ordering = ["name"]

    def __str__(self):
        return self.name


class Student(BaseModel):
    """School-specific enrollment data for a user with user_type=student.
    Login/identity lives on accounts.User (Staff/User Management already
    owns that); this only adds what's specific to being enrolled."""

    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"       # admitted via the online workflow, not yet registered/active
        ACTIVE = "active", "Active"
        GRADUATED = "graduated", "Graduated"
        WITHDRAWN = "withdrawn", "Withdrawn"
        SUSPENDED = "suspended", "Suspended"

    user = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="student_profile")
    class_arm = models.ForeignKey(
        "configuration.ClassArm", on_delete=models.SET_NULL, null=True, blank=True, related_name="students"
    )
    # Where a released class reallocation will move this student at the next
    # term's start. Display-only until then — class_arm is untouched, so the
    # current term (attendance, timetable, its own results) stays correct.
    # Cleared when the reallocation is applied. See apps.academics.services.
    next_class_arm = models.ForeignKey(
        "configuration.ClassArm", on_delete=models.SET_NULL, null=True, blank=True, related_name="incoming_students"
    )
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    guardian_name = models.CharField(max_length=150, blank=True)
    guardian_phone = models.CharField(max_length=20, blank=True)
    guardian_email = models.EmailField(blank=True)
    # Linked parent-portal account, if one was created/reused for this
    # student — distinct from the plain-text guardian_* fields above, which
    # stay for display even when no portal account exists.
    guardian_user = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="guarded_students"
    )
    admission_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    # The permanent, searchable identifier generated once the first school
    # fee clears (see apps.admissions.services) — distinct from the
    # Student ID (user.identifier, generated at admission approval).
    registration_number = models.CharField(max_length=30, blank=True, null=True)

    class Meta(BaseModel.Meta):
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["registration_number"], condition=models.Q(registration_number__isnull=False),
                name="academics_student_registration_number_uniq",
            ),
        ]

    def __str__(self):
        return self.user.full_name


class ClassSubjectAssignment(BaseModel):
    """Which subjects are taught in a class-arm, by whom, this session —
    backs the academic "Classes" page and lets Timetable/Assignments/Results
    all point at the same source of truth for who teaches what."""

    class_arm = models.ForeignKey(
        "configuration.ClassArm", on_delete=models.CASCADE, related_name="subject_assignments"
    )
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="class_assignments")
    teacher = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="teaching_assignments"
    )
    session = models.ForeignKey(
        "configuration.AcademicSession", on_delete=models.CASCADE, related_name="class_subject_assignments"
    )

    class Meta(BaseModel.Meta):
        unique_together = ("class_arm", "subject", "session")
        ordering = ["class_arm__school_class__level_order", "class_arm__name", "subject__name"]

    def __str__(self):
        return f"{self.subject.name} — {self.class_arm} ({self.session.name})"


class ClassTeacherAssignment(BaseModel):
    """The form/class teacher responsible for a class-arm in a given session."""

    class_arm = models.ForeignKey(
        "configuration.ClassArm", on_delete=models.CASCADE, related_name="class_teacher_assignments"
    )
    teacher = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="class_teacher_of")
    session = models.ForeignKey(
        "configuration.AcademicSession", on_delete=models.CASCADE, related_name="class_teacher_assignments"
    )

    class Meta(BaseModel.Meta):
        unique_together = ("class_arm", "session")

    def __str__(self):
        return f"{self.teacher.full_name} — {self.class_arm} ({self.session.name})"


class TimetableSlot(BaseModel):
    class Day(models.TextChoices):
        MONDAY = "monday", "Monday"
        TUESDAY = "tuesday", "Tuesday"
        WEDNESDAY = "wednesday", "Wednesday"
        THURSDAY = "thursday", "Thursday"
        FRIDAY = "friday", "Friday"

    class_arm = models.ForeignKey("configuration.ClassArm", on_delete=models.CASCADE, related_name="timetable_slots")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="timetable_slots")
    teacher = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="timetable_slots"
    )
    session = models.ForeignKey(
        "configuration.AcademicSession", on_delete=models.CASCADE, related_name="timetable_slots"
    )
    day = models.CharField(max_length=10, choices=Day.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta(BaseModel.Meta):
        ordering = ["day", "start_time"]
        unique_together = ("class_arm", "day", "start_time", "session")

    def __str__(self):
        return f"{self.class_arm} {self.day} {self.start_time}-{self.end_time}: {self.subject.name}"


class AttendanceRecord(BaseModel):
    class Status(models.TextChoices):
        PRESENT = "present", "Present"
        ABSENT = "absent", "Absent"
        LATE = "late", "Late"
        EXCUSED = "excused", "Excused"

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="attendance_records")
    class_arm = models.ForeignKey(
        "configuration.ClassArm", on_delete=models.CASCADE, related_name="attendance_records"
    )
    date = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PRESENT)
    term = models.ForeignKey("configuration.Term", on_delete=models.CASCADE, related_name="attendance_records")
    recorded_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="attendance_recorded"
    )
    notes = models.CharField(max_length=255, blank=True)

    class Meta(BaseModel.Meta):
        unique_together = ("student", "date")
        ordering = ["-date"]

    def __str__(self):
        return f"{self.student} — {self.date} ({self.status})"


class Exam(BaseModel):
    class ExamType(models.TextChoices):
        TEST = "test", "Test"
        MIDTERM = "midterm", "Midterm"
        FINAL = "final", "Final Exam"
        MOCK = "mock", "Mock Exam"

    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        ONGOING = "ongoing", "Ongoing"
        COMPLETED = "completed", "Completed"
        PUBLISHED = "published", "Published"

    name = models.CharField(max_length=150)
    exam_type = models.CharField(max_length=20, choices=ExamType.choices, default=ExamType.TEST)
    session = models.ForeignKey("configuration.AcademicSession", on_delete=models.CASCADE, related_name="exams")
    term = models.ForeignKey("configuration.Term", on_delete=models.CASCADE, related_name="exams")
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)

    class Meta(BaseModel.Meta):
        ordering = ["-start_date"]

    def __str__(self):
        return self.name


class ExamScore(BaseModel):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="scores")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="exam_scores")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="exam_scores")
    score = models.DecimalField(max_digits=5, decimal_places=2)
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    # Optional CA/Exam breakdown for the compiled report card. When both are
    # supplied, `score` is server-computed as their sum (see ExamScoresView)
    # rather than trusted as independently entered — a subject not split
    # into components just leaves these null and keeps using `score` as-is.
    ca_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    exam_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    remark = models.CharField(max_length=100, blank=True)
    entered_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="scores_entered"
    )

    class Meta(BaseModel.Meta):
        unique_together = ("exam", "student", "subject")
        ordering = ["student", "subject"]

    def __str__(self):
        return f"{self.student} — {self.subject.name}: {self.score}/{self.max_score}"


class ReportCardRemark(BaseModel):
    """Class-teacher and principal narrative comments for one student's
    report card, one row per exam — distinct from ExamScore.remark, which is
    per-subject."""

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="report_card_remarks")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="report_card_remarks")
    class_teacher_remark = models.TextField(blank=True, default="")
    principal_remark = models.TextField(blank=True, default="")

    class Meta(BaseModel.Meta):
        unique_together = ("exam", "student")

    def __str__(self):
        return f"Remarks — {self.student} ({self.exam.name})"


class SkillRating(BaseModel):
    """Psychomotor & affective skills block on the report card (punctuality,
    neatness, etc.), rated 1-5, one row per skill per student per exam."""

    class Skill(models.TextChoices):
        PUNCTUALITY = "punctuality", "Punctuality"
        NEATNESS = "neatness", "Neatness"
        LEADERSHIP = "leadership", "Leadership"
        HONESTY = "honesty", "Honesty"

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="skill_ratings")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="skill_ratings")
    skill = models.CharField(max_length=20, choices=Skill.choices)
    rating = models.PositiveSmallIntegerField(default=3)

    class Meta(BaseModel.Meta):
        unique_together = ("exam", "student", "skill")

    def __str__(self):
        return f"{self.student} — {self.get_skill_display()}: {self.rating}"


class ResultSubmission(BaseModel):
    """Tracks a teacher's submit-for-approval step on one class-arm+subject's
    scores for one exam — separate from Exam.status (which is exam-wide,
    shared across every class/subject sitting it) since approval happens per
    teacher's own slice before a principal publishes the exam as a whole."""

    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="result_submissions")
    class_arm = models.ForeignKey(
        "configuration.ClassArm", on_delete=models.CASCADE, related_name="result_submissions"
    )
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="result_submissions")
    teacher = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="result_submissions"
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUBMITTED)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="result_submissions_reviewed"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_note = models.CharField(max_length=255, blank=True)

    class Meta(BaseModel.Meta):
        unique_together = ("exam", "class_arm", "subject")
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.subject.name} — {self.class_arm} ({self.exam.name}): {self.status}"


class Assignment(BaseModel):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    class_arm = models.ForeignKey("configuration.ClassArm", on_delete=models.CASCADE, related_name="assignments")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="assignments")
    teacher = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="assignments_given"
    )
    due_date = models.DateField()
    session = models.ForeignKey("configuration.AcademicSession", on_delete=models.CASCADE, related_name="assignments")
    term = models.ForeignKey("configuration.Term", on_delete=models.CASCADE, related_name="assignments")

    class Meta(BaseModel.Meta):
        ordering = ["-due_date"]

    def __str__(self):
        return self.title


class ClassBandingConfig(BaseModel):
    """Opt-in switch + settings for performance-based arm reallocation on one
    class. A class with no config, or a disabled one, is never touched by the
    reallocation engine (nursery/KG classes, say). `holding_arm` is this
    class's "N_S" arm — where brand-new intake sits until they have a first
    term average to be banded on."""

    school_class = models.OneToOneField(
        "configuration.SchoolClass", on_delete=models.CASCADE, related_name="banding_config"
    )
    enabled = models.BooleanField(default=False)
    holding_arm = models.ForeignKey(
        "configuration.ClassArm", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    class Meta(BaseModel.Meta):
        pass

    def __str__(self):
        return f"Banding config — {self.school_class.name} ({'on' if self.enabled else 'off'})"


class ClassReallocation(BaseModel):
    """One computed proposal for re-sorting a class's students across its
    ranked arms (A top, B middle, C lowest), off one term's results.

    Three-step lifecycle, three timestamps — deliberately NOT collapsed:

      computed  → a hidden proposal; nothing on Student/ClassArm has moved
      released  → students & parents can see their next_class_arm; still
                  nothing has physically moved — the current term runs on
                  in the existing arms
      applied   → at the next term's start: next_class_arm → class_arm, and
                  arm capacities ratchet up for any absorbed new students

    Only runs for within-session term transitions (1st→2nd, 2nd→3rd). A
    3rd-term / year-end result is promotion's job, not this engine's; the
    banding of a freshly promoted cohort happens afterwards as an
    initial_banding pass (see apps.academics.services)."""

    class Status(models.TextChoices):
        PENDING = "pending", "Computed (pending release)"
        RELEASED = "released", "Released (visible, not yet applied)"
        APPLIED = "applied", "Applied"
        SUPERSEDED = "superseded", "Superseded by a newer compute"

    school_class = models.ForeignKey(
        "configuration.SchoolClass", on_delete=models.CASCADE, related_name="reallocations"
    )
    session = models.ForeignKey(
        "configuration.AcademicSession", on_delete=models.CASCADE, related_name="reallocations"
    )
    # The term whose results drove this compute. Moves take effect at the
    # start of the next term in the same session.
    term = models.ForeignKey(
        "configuration.Term", on_delete=models.CASCADE, related_name="reallocations"
    )
    source_exam = models.ForeignKey(
        Exam, on_delete=models.SET_NULL, null=True, blank=True, related_name="reallocations"
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    computed_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="reallocations_computed"
    )
    computed_at = models.DateTimeField(auto_now_add=True)
    released_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="reallocations_released"
    )
    released_at = models.DateTimeField(null=True, blank=True)
    # applied_by is null when apply ran automatically at term rollover.
    applied_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="reallocations_applied"
    )
    applied_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["-computed_at"]
        constraints = [
            # At most one live (pending OR released) proposal per class+term.
            # A re-compute replaces the pending one; an already-released one
            # must be applied or superseded before another can be computed.
            models.UniqueConstraint(
                fields=["school_class", "session", "term"],
                condition=models.Q(status__in=["pending", "released"]),
                name="academics_one_live_reallocation_per_class_term",
            ),
        ]

    def __str__(self):
        return f"Reallocation — {self.school_class.name} {self.term.name} {self.session.name} ({self.status})"


class ClassReallocationMove(BaseModel):
    """One student's line in a ClassReallocation: where they move and by which
    mechanism. `capacity_delta` is +1 only for an N_S student absorbed into a
    band (that band's capacity ratchets up by the summed deltas at apply
    time); it is always 0 for a re-rank swap, which never changes a
    capacity."""

    class Mechanism(models.TextChoices):
        RERANK = "rerank", "Performance re-rank (swap)"
        NS_ABSORPTION = "ns_absorption", "N_S absorption (additive)"
        INITIAL_BANDING = "initial_banding", "Initial banding"

    reallocation = models.ForeignKey(ClassReallocation, on_delete=models.CASCADE, related_name="moves")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="reallocation_moves")
    from_arm = models.ForeignKey(
        "configuration.ClassArm", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    to_arm = models.ForeignKey(
        "configuration.ClassArm", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    mechanism = models.CharField(max_length=20, choices=Mechanism.choices)
    term_average = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    rank = models.PositiveIntegerField(null=True, blank=True)
    capacity_delta = models.SmallIntegerField(default=0)

    class Meta(BaseModel.Meta):
        unique_together = ("reallocation", "student")
        ordering = ["rank"]

    def __str__(self):
        return f"{self.student} — {self.from_arm} → {self.to_arm} ({self.mechanism})"


class PromotionRecord(BaseModel):
    """Audit trail of promotion decisions — who moved from which class/session
    to which, so promotion is a reviewable event, not a silent field update."""

    class Outcome(models.TextChoices):
        PROMOTED = "promoted", "Promoted"
        REPEATED = "repeated", "Repeated"
        GRADUATED = "graduated", "Graduated"
        WITHDRAWN = "withdrawn", "Withdrawn"

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="promotion_records")
    from_class_arm = models.ForeignKey(
        "configuration.ClassArm", on_delete=models.SET_NULL, null=True, blank=True, related_name="promotions_from"
    )
    to_class_arm = models.ForeignKey(
        "configuration.ClassArm", on_delete=models.SET_NULL, null=True, blank=True, related_name="promotions_to"
    )
    from_session = models.ForeignKey(
        "configuration.AcademicSession", on_delete=models.CASCADE, related_name="promotions_from"
    )
    to_session = models.ForeignKey(
        "configuration.AcademicSession", on_delete=models.CASCADE, related_name="promotions_to"
    )
    outcome = models.CharField(max_length=20, choices=Outcome.choices)
    promoted_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="promotions_actioned"
    )
    promoted_at = models.DateTimeField(auto_now_add=True)

    class Meta(BaseModel.Meta):
        ordering = ["-promoted_at"]

    def __str__(self):
        return f"{self.student} — {self.outcome} ({self.from_session.name} → {self.to_session.name})"
