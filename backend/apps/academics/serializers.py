from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
from rest_framework import serializers

from apps.accounts.serializers import UserCreateSerializer
from apps.configuration.models import AcademicSession, ClassArm, SchoolClass, Term
from apps.settings_app.numbering import generate_number

from .models import (
    Assignment,
    AttendanceRecord,
    ClassBandingConfig,
    ClassReallocation,
    ClassReallocationMove,
    ClassSubjectAssignment,
    ClassTeacherAssignment,
    Exam,
    ExamScore,
    PromotionRecord,
    ReportCardRemark,
    ResultSubmission,
    SkillRating,
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
    # Set once a class reallocation is released; where this student moves at
    # the next term's start. Display-only — class_arm above is still current.
    next_class_arm_label = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            "id", "user", "full_name", "email", "identifier", "is_active",
            "class_arm", "class_arm_label", "next_class_arm", "next_class_arm_label",
            "date_of_birth", "gender",
            "guardian_name", "guardian_phone", "guardian_email",
            "admission_date", "status", "registration_number", "created_at",
        ]
        read_only_fields = ["id", "user", "created_at", "next_class_arm"]

    def get_class_arm_label(self, obj):
        return str(obj.class_arm) if obj.class_arm else None

    def get_next_class_arm_label(self, obj):
        return str(obj.next_class_arm) if obj.next_class_arm_id else None


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
        identifier = validated_data.pop("identifier", "") or generate_number("admission")
        user_payload = {
            "full_name": validated_data.pop("full_name"),
            "email": validated_data.pop("email", "") or None,
            "phone": validated_data.pop("phone", "") or None,
            "identifier": identifier,
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
            "score", "max_score", "ca_score", "exam_score", "remark", "percentage", "entered_by",
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
            has_split = "ca_score" in s and "exam_score" in s
            if "student" not in s or not (has_split or "score" in s):
                raise serializers.ValidationError("Each entry needs 'student' and either 'score' or both 'ca_score'/'exam_score'.")
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


class ResultSubmissionSerializer(serializers.ModelSerializer):
    exam_name = serializers.CharField(source="exam.name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    class_arm_label = serializers.CharField(source="class_arm.__str__", read_only=True)
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True, default=None)
    reviewed_by_name = serializers.CharField(source="reviewed_by.full_name", read_only=True, default=None)

    class Meta:
        model = ResultSubmission
        fields = [
            "id", "exam", "exam_name", "class_arm", "class_arm_label", "subject", "subject_name",
            "teacher", "teacher_name", "status", "submitted_at",
            "reviewed_by", "reviewed_by_name", "reviewed_at", "review_note",
        ]
        read_only_fields = fields


class PromotionRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    from_class_arm_label = serializers.SerializerMethodField()
    to_class_arm_label = serializers.SerializerMethodField()

    class Meta:
        model = PromotionRecord
        fields = [
            "id", "student", "student_name", "from_class_arm", "from_class_arm_label",
            "to_class_arm", "to_class_arm_label", "from_session", "to_session",
            "outcome", "promoted_by", "promoted_at",
        ]
        read_only_fields = fields

    def get_from_class_arm_label(self, obj):
        return str(obj.from_class_arm) if obj.from_class_arm else None

    def get_to_class_arm_label(self, obj):
        return str(obj.to_class_arm) if obj.to_class_arm else None


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


# ------------------------------------------------ Class-arm reallocation
class ClassBandingConfigSerializer(serializers.ModelSerializer):
    school_class_name = serializers.CharField(source="school_class.name", read_only=True)
    holding_arm_label = serializers.SerializerMethodField()

    class Meta:
        model = ClassBandingConfig
        fields = ["id", "school_class", "school_class_name", "enabled", "holding_arm", "holding_arm_label"]
        read_only_fields = ["id", "school_class"]

    def get_holding_arm_label(self, obj):
        return str(obj.holding_arm) if obj.holding_arm else None

    def validate_holding_arm(self, arm):
        if arm and self.instance and arm.school_class_id != self.instance.school_class_id:
            raise serializers.ValidationError("The holding arm must belong to this class.")
        return arm


class ClassReallocationMoveSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    from_arm_label = serializers.SerializerMethodField()
    to_arm_label = serializers.SerializerMethodField()
    direction = serializers.SerializerMethodField()

    class Meta:
        model = ClassReallocationMove
        fields = [
            "id", "student", "student_name", "from_arm", "from_arm_label",
            "to_arm", "to_arm_label", "mechanism", "term_average", "rank",
            "capacity_delta", "direction",
        ]
        read_only_fields = fields

    def get_from_arm_label(self, obj):
        return str(obj.from_arm) if obj.from_arm else None

    def get_to_arm_label(self, obj):
        return str(obj.to_arm) if obj.to_arm else None

    def get_direction(self, obj):
        if obj.mechanism == ClassReallocationMove.Mechanism.NS_ABSORPTION:
            return "intake"
        if obj.from_arm_id == obj.to_arm_id:
            return "unchanged"
        if obj.from_arm and obj.to_arm:
            # bands rank by name (A best); a lexically smaller target = a rise
            return "up" if obj.to_arm.name < obj.from_arm.name else "down"
        return "banded"


class ClassReallocationSerializer(serializers.ModelSerializer):
    school_class_name = serializers.CharField(source="school_class.name", read_only=True)
    session_name = serializers.CharField(source="session.name", read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True)
    source_exam_name = serializers.CharField(source="source_exam.name", read_only=True, default=None)
    move_count = serializers.IntegerField(source="moves.count", read_only=True)

    class Meta:
        model = ClassReallocation
        fields = [
            "id", "school_class", "school_class_name", "session", "session_name",
            "term", "term_name", "source_exam", "source_exam_name", "status",
            "computed_by", "computed_at", "released_by", "released_at",
            "applied_by", "applied_at", "notes", "move_count",
        ]
        read_only_fields = fields


class ClassReallocationDetailSerializer(ClassReallocationSerializer):
    """Adds the full move list + a per-band before/after summary, so a review
    screen can show exactly what a release would do before it happens."""

    moves = ClassReallocationMoveSerializer(many=True, read_only=True)
    arm_summary = serializers.SerializerMethodField()

    class Meta(ClassReallocationSerializer.Meta):
        fields = ClassReallocationSerializer.Meta.fields + ["moves", "arm_summary"]

    def get_arm_summary(self, obj):
        from .services import banded_arms

        config = getattr(obj.school_class, "banding_config", None)
        if not config:
            return []
        bands = banded_arms(obj.school_class, config)
        moves = list(obj.moves.all())
        moved_ids = {m.student_id for m in moves}

        current = {a.id: 0 for a in bands}
        for s in Student.objects.filter(
            class_arm__school_class=obj.school_class, status=Student.Status.ACTIVE,
        ).exclude(class_arm_id=config.holding_arm_id).values_list("class_arm_id", flat=True):
            if s in current:
                current[s] += 1

        proposed = {a.id: 0 for a in bands}
        proposed_avgs = {a.id: [] for a in bands}
        for m in moves:
            if m.to_arm_id in proposed:
                proposed[m.to_arm_id] += 1
                if m.term_average is not None:
                    proposed_avgs[m.to_arm_id].append(m.term_average)
        # ungradeable existing students stay put — count them in their band
        for s in Student.objects.filter(
            class_arm__school_class=obj.school_class, status=Student.Status.ACTIVE,
        ).exclude(class_arm_id=config.holding_arm_id).exclude(id__in=moved_ids).values_list("class_arm_id", flat=True):
            if s in proposed:
                proposed[s] += 1

        delta = {a.id: 0 for a in bands}
        for m in moves:
            if m.capacity_delta and m.to_arm_id in delta:
                delta[m.to_arm_id] += m.capacity_delta

        out = []
        for a in bands:
            avgs = sorted(proposed_avgs[a.id])
            out.append({
                "arm": str(a), "arm_id": str(a.id),
                "current_count": current[a.id],
                "proposed_count": proposed[a.id],
                "capacity": a.capacity,
                "capacity_after": (a.capacity + delta[a.id]) if a.capacity is not None else None,
                "proposed_score_range": [float(avgs[0]), float(avgs[-1])] if avgs else None,
            })
        return out


class ReallocationComputeSerializer(serializers.Serializer):
    school_class = serializers.PrimaryKeyRelatedField(queryset=SchoolClass.objects.all())
    source_exam = serializers.PrimaryKeyRelatedField(queryset=Exam.objects.all())
    kind = serializers.ChoiceField(choices=["reallocation", "initial_banding"], default="reallocation")


class ArmCapacitySerializer(serializers.Serializer):
    capacity = serializers.IntegerField(min_value=0, allow_null=True)
