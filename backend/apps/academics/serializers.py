from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
from rest_framework import serializers

from apps.accounts.serializers import UserCreateSerializer
from apps.configuration.models import AcademicSession, ClassArm, Term

from .models import (
    Assignment,
    AttendanceRecord,
    ClassSubjectAssignment,
    ClassTeacherAssignment,
    Exam,
    ExamScore,
    PromotionRecord,
    Student,
    Subject,
    TimetableSlot,
)

User = get_user_model()


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "name", "code", "department", "is_core"]


class StudentSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    identifier = serializers.CharField(source="user.identifier", read_only=True)
    is_active = serializers.BooleanField(source="user.is_active", read_only=True)
    class_arm_label = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            "id", "user", "full_name", "email", "identifier", "is_active",
            "class_arm", "class_arm_label", "date_of_birth", "gender",
            "guardian_name", "guardian_phone", "guardian_email",
            "admission_date", "status", "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]

    def get_class_arm_label(self, obj):
        return str(obj.class_arm) if obj.class_arm else None


class StudentCreateSerializer(serializers.ModelSerializer):
    """Creates the underlying accounts.User (user_type=student) and the
    Student enrollment profile together, in one form submission — delegates
    account creation to UserCreateSerializer so validation (uniqueness,
    password strength) isn't duplicated. Password is optional: if omitted, a
    temporary one is generated, same acknowledgement pattern as the existing
    admin-reset-password flow."""

    full_name = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=False, allow_blank=True, write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True, write_only=True)
    identifier = serializers.CharField(required=False, allow_blank=True, write_only=True)
    password = serializers.CharField(required=False, allow_blank=True, write_only=True, trim_whitespace=False)
    temporary_password = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            "id", "full_name", "email", "phone", "identifier", "password", "temporary_password",
            "class_arm", "date_of_birth", "gender", "guardian_name", "guardian_phone",
            "guardian_email", "admission_date", "status",
        ]
        read_only_fields = ["id"]

    def get_temporary_password(self, obj):
        return getattr(obj, "_temporary_password", None)

    def create(self, validated_data):
        password = validated_data.pop("password", "") or get_random_string(length=12)
        auto_generated = "password" not in self.initial_data or not self.initial_data.get("password")
        user_payload = {
            "full_name": validated_data.pop("full_name"),
            "email": validated_data.pop("email", "") or None,
            "phone": validated_data.pop("phone", "") or None,
            "identifier": validated_data.pop("identifier", "") or None,
            "user_type": User.UserType.STUDENT,
            "password": password,
        }
        user_serializer = UserCreateSerializer(data=user_payload)
        user_serializer.is_valid(raise_exception=True)
        user = user_serializer.save()

        student = Student.objects.create(user=user, **validated_data)
        if auto_generated:
            student._temporary_password = password
        return student


class ClassSubjectAssignmentSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True, default=None)

    class Meta:
        model = ClassSubjectAssignment
        fields = ["id", "class_arm", "subject", "subject_name", "teacher", "teacher_name", "session"]
        read_only_fields = ["id", "class_arm", "session"]


class ClassTeacherAssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)

    class Meta:
        model = ClassTeacherAssignment
        fields = ["id", "class_arm", "teacher", "teacher_name", "session"]
        read_only_fields = ["id", "class_arm"]


class ClassAcademicSerializer(serializers.ModelSerializer):
    """Read view of an existing ClassArm enriched with this session's subject
    assignments, class teacher, and student count — the "Classes" academic
    page. Class/arm creation itself stays in Administration."""

    school_class_name = serializers.CharField(source="school_class.name", read_only=True)
    student_count = serializers.SerializerMethodField()
    class_teacher = serializers.SerializerMethodField()
    subject_assignments = serializers.SerializerMethodField()

    class Meta:
        model = ClassArm
        fields = ["id", "name", "school_class", "school_class_name", "student_count", "class_teacher", "subject_assignments"]

    def get_student_count(self, obj):
        return obj.students.filter(status=Student.Status.ACTIVE).count()

    def get_class_teacher(self, obj):
        session = self.context.get("session")
        assignment = obj.class_teacher_assignments.filter(session=session).select_related("teacher").first() if session else None
        return {"id": assignment.teacher.id, "name": assignment.teacher.full_name} if assignment else None

    def get_subject_assignments(self, obj):
        session = self.context.get("session")
        if not session:
            return []
        qs = obj.subject_assignments.filter(session=session).select_related("subject", "teacher")
        return [
            {
                "id": a.id,
                "subject": a.subject.id,
                "subject_name": a.subject.name,
                "teacher": a.teacher.id if a.teacher else None,
                "teacher_name": a.teacher.full_name if a.teacher else None,
            }
            for a in qs
        ]


class TimetableSlotSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True, default=None)
    class_arm_label = serializers.CharField(source="class_arm.__str__", read_only=True)

    class Meta:
        model = TimetableSlot
        fields = [
            "id", "class_arm", "class_arm_label", "subject", "subject_name",
            "teacher", "teacher_name", "session", "day", "start_time", "end_time",
        ]
        read_only_fields = ["id", "session"]

    def validate(self, attrs):
        start = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end = attrs.get("end_time", getattr(self.instance, "end_time", None))
        if start and end and end <= start:
            raise serializers.ValidationError({"end_time": "End time must be after the start time."})
        return attrs


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = ["id", "student", "student_name", "class_arm", "date", "status", "term", "recorded_by", "notes"]
        read_only_fields = ["id", "recorded_by"]


class AttendanceBulkMarkSerializer(serializers.Serializer):
    """One submission marks an entire class-arm's roster for a single date."""

    class_arm = serializers.PrimaryKeyRelatedField(queryset=ClassArm.objects.all())
    date = serializers.DateField()
    term = serializers.PrimaryKeyRelatedField(queryset=Term.objects.all())
    records = serializers.ListField(child=serializers.DictField(), allow_empty=False)

    def validate_records(self, records):
        valid_statuses = {c.value for c in AttendanceRecord.Status}
        for r in records:
            if "student" not in r or "status" not in r:
                raise serializers.ValidationError("Each record needs 'student' and 'status'.")
            if r["status"] not in valid_statuses:
                raise serializers.ValidationError(f"Invalid status: {r['status']}")
        return records


class ExamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exam
        fields = ["id", "name", "exam_type", "session", "term", "start_date", "end_date", "status"]
        read_only_fields = ["id", "session", "term"]


class ExamScoreSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    percentage = serializers.SerializerMethodField()

    class Meta:
        model = ExamScore
        fields = [
            "id", "exam", "student", "student_name", "subject", "subject_name",
            "score", "max_score", "remark", "percentage", "entered_by",
        ]
        read_only_fields = ["id", "entered_by"]

    def get_percentage(self, obj):
        return round(float(obj.score) / float(obj.max_score) * 100, 1) if obj.max_score else None

    def validate(self, attrs):
        score = attrs.get("score", getattr(self.instance, "score", None))
        max_score = attrs.get("max_score", getattr(self.instance, "max_score", 100))
        if score is not None and max_score is not None and score > max_score:
            raise serializers.ValidationError({"score": "Score cannot exceed the maximum score."})
        return attrs


class ExamScoreBulkEntrySerializer(serializers.Serializer):
    """One submission enters a whole class-arm's scores for one exam+subject.
    exam comes from the URL, not the body — see ExamScoresView."""

    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())
    max_score = serializers.DecimalField(max_digits=5, decimal_places=2, default=100)
    scores = serializers.ListField(child=serializers.DictField(), allow_empty=False)

    def validate_scores(self, scores):
        for s in scores:
            if "student" not in s or "score" not in s:
                raise serializers.ValidationError("Each entry needs 'student' and 'score'.")
        return scores


class AssignmentSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    class_arm_label = serializers.CharField(source="class_arm.__str__", read_only=True)
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True, default=None)

    class Meta:
        model = Assignment
        fields = [
            "id", "title", "description", "class_arm", "class_arm_label", "subject", "subject_name",
            "teacher", "teacher_name", "due_date", "session", "term",
        ]
        read_only_fields = ["id", "session", "term", "teacher"]


class PromotionRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    from_class_arm_label = serializers.CharField(source="from_class_arm.__str__", read_only=True, default=None)
    to_class_arm_label = serializers.CharField(source="to_class_arm.__str__", read_only=True, default=None)

    class Meta:
        model = PromotionRecord
        fields = [
            "id", "student", "student_name", "from_class_arm", "from_class_arm_label",
            "to_class_arm", "to_class_arm_label", "from_session", "to_session",
            "outcome", "promoted_by", "promoted_at",
        ]
        read_only_fields = fields


class PromotionActionSerializer(serializers.Serializer):
    """One submission promotes a batch of students out of a source class-arm
    into a target session, each with their own outcome/destination."""

    from_class_arm = serializers.PrimaryKeyRelatedField(queryset=ClassArm.objects.all())
    from_session = serializers.PrimaryKeyRelatedField(queryset=AcademicSession.objects.all())
    to_session = serializers.PrimaryKeyRelatedField(queryset=AcademicSession.objects.all())
    decisions = serializers.ListField(child=serializers.DictField(), allow_empty=False)

    def validate_decisions(self, decisions):
        valid_outcomes = {c.value for c in PromotionRecord.Outcome}
        for d in decisions:
            if "student" not in d or "outcome" not in d:
                raise serializers.ValidationError("Each decision needs 'student' and 'outcome'.")
            if d["outcome"] not in valid_outcomes:
                raise serializers.ValidationError(f"Invalid outcome: {d['outcome']}")
            if d["outcome"] == PromotionRecord.Outcome.PROMOTED and not d.get("to_class_arm"):
                raise serializers.ValidationError("'promoted' decisions need a 'to_class_arm'.")
        return decisions
