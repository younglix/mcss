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
        ACTIVE = "active", "Active"
        GRADUATED = "graduated", "Graduated"
        WITHDRAWN = "withdrawn", "Withdrawn"
        SUSPENDED = "suspended", "Suspended"

    user = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="student_profile")
    class_arm = models.ForeignKey(
        "configuration.ClassArm", on_delete=models.SET_NULL, null=True, blank=True, related_name="students"
    )
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    guardian_name = models.CharField(max_length=150, blank=True)
    guardian_phone = models.CharField(max_length=20, blank=True)
    guardian_email = models.EmailField(blank=True)
    admission_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)

    class Meta(BaseModel.Meta):
        ordering = ["-created_at"]

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
    remark = models.CharField(max_length=100, blank=True)
    entered_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="scores_entered"
    )

    class Meta(BaseModel.Meta):
        unique_together = ("exam", "student", "subject")
        ordering = ["student", "subject"]

    def __str__(self):
        return f"{self.student} — {self.subject.name}: {self.score}/{self.max_score}"


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
