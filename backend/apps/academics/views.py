from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q, Sum
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from xhtml2pdf import pisa

from apps.audit.services import log
from apps.configuration.models import AcademicSession, ClassArm, GradeScale, SchoolClass, Term
from apps.rbac.permissions import HasPermission, get_effective_permissions
from common.responses import failure, success

from .models import (
    Assignment,
    AttendanceRecord,
    ClassBandingConfig,
    ClassReallocation,
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
from .serializers import (
    ArmCapacitySerializer,
    AssignmentSerializer,
    AttendanceBulkMarkSerializer,
    AttendanceRecordSerializer,
    ClassAcademicSerializer,
    ClassBandingConfigSerializer,
    ClassReallocationDetailSerializer,
    ClassReallocationSerializer,
    ClassSubjectAssignmentSerializer,
    ClassTeacherAssignmentSerializer,
    ExamScoreBulkEntrySerializer,
    ExamScoreSerializer,
    ExamSerializer,
    PromotionActionSerializer,
    PromotionRecordSerializer,
    ReallocationComputeSerializer,
    ResultSubmissionSerializer,
    StudentCreateSerializer,
    StudentSerializer,
    SubjectSerializer,
    TimetableSlotSerializer,
)

User = get_user_model()


def _current_session():
    return AcademicSession.objects.filter(is_current=True).first()


# ------------------------------------------------------ Teacher self-service ownership
# Mirrors the _child_or_403/_own_student_or_403 pattern above: these self-
# service "teaching" views skip HasPermission entirely (IsAuthenticated
# only) and instead gate purely on "is this actually one of my own classes/
# subjects this session" — so a teacher account never needs to be granted
# admin-wide academics.* permissions just to run their own workflow.
def _teaching_class_arm_ids(user, session):
    """Every class-arm this teacher touches this session: either teaching a
    subject there, or being its form/class teacher."""
    if not session:
        return set()
    taught = set(
        ClassSubjectAssignment.objects.filter(teacher=user, session=session).values_list("class_arm_id", flat=True)
    )
    class_teacher_of = set(
        ClassTeacherAssignment.objects.filter(teacher=user, session=session).values_list("class_arm_id", flat=True)
    )
    return taught | class_teacher_of


def _teaches_subject_in_arm(user, session, class_arm_id, subject_id):
    if not session:
        return False
    return ClassSubjectAssignment.objects.filter(
        teacher=user, session=session, class_arm_id=class_arm_id, subject_id=subject_id
    ).exists()


def _is_class_teacher_of(user, session, class_arm_id):
    if not session:
        return False
    return ClassTeacherAssignment.objects.filter(teacher=user, session=session, class_arm_id=class_arm_id).exists()


def _permission_mixin(module):
    """Builds a get_permissions() mixin: GET->view, everything else-><verb>.
    <verb> is passed per-view since modules don't share one create/edit vocab
    (e.g. results uses enter/edit, promotion uses action)."""

    class Mixin:
        write_action = "edit"

        def get_permissions(self):
            code = f"{module}.view" if self.request.method in ("GET", "HEAD", "OPTIONS") else f"{module}.{self.write_action}"
            return [HasPermission(code)]

    return Mixin


SubjectPermissionMixin = _permission_mixin("subjects")
StudentPermissionMixin = _permission_mixin("students")
ClassAcademicPermissionMixin = _permission_mixin("classes")
TimetablePermissionMixin = _permission_mixin("timetable")
AttendancePermissionMixin = _permission_mixin("attendance")
ExamPermissionMixin = _permission_mixin("exams")
AssignmentPermissionMixin = _permission_mixin("assignments")
ReportsPermissionMixin = _permission_mixin("reports")


# ---------------------------------------------------------------- Subjects
class SubjectsView(SubjectPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = SubjectSerializer
    queryset = Subject.objects.all()

    def perform_create(self, serializer):
        subject = serializer.save()
        log(actor=self.request.user, action="academics.subject_created", target=subject, request=self.request)


class SubjectDetailView(SubjectPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = SubjectSerializer
    queryset = Subject.objects.all()
    lookup_url_kwarg = "subject_id"

    def perform_update(self, serializer):
        subject = serializer.save()
        log(actor=self.request.user, action="academics.subject_updated", target=subject, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="academics.subject_deleted", target=instance, request=self.request)
        instance.delete()


# ---------------------------------------------------------------- Students
class StudentsView(StudentPermissionMixin, ListCreateAPIView):
    write_action = "create"
    search_fields = ["user__full_name", "user__email", "user__identifier"]
    filterset_fields = ["status"]

    def get_queryset(self):
        # class_arm is filtered manually (not via filterset_fields) so an
        # unmatched/placeholder id just yields an empty list instead of
        # django-filter's ModelChoiceFilter rejecting it as an invalid
        # choice — the frontend queries a nil UUID before a class is picked.
        qs = Student.objects.select_related("user", "class_arm__school_class", "next_class_arm__school_class").filter(user__is_deleted=False)
        class_arm = self.request.query_params.get("class_arm")
        if class_arm:
            qs = qs.filter(class_arm_id=class_arm)
        return qs

    def get_serializer_class(self):
        return StudentCreateSerializer if self.request.method == "POST" else StudentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()
        log(actor=request.user, action="academics.student_created", target=student, request=request)
        return success(message="Student enrolled.", data=serializer.to_representation(student), status=201)


class StudentDetailView(StudentPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = StudentSerializer
    queryset = Student.objects.select_related("user", "class_arm__school_class", "next_class_arm__school_class").filter(user__is_deleted=False)

    def perform_update(self, serializer):
        student = serializer.save()
        log(actor=self.request.user, action="academics.student_updated", target=student, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="academics.student_withdrawn", target=instance, request=self.request)
        instance.user.soft_delete()
        instance.user.is_active = False
        instance.user.save(update_fields=["is_active"])


class MyChildrenView(APIView):
    """Parent Portal's child-switcher: every Student this logged-in user is
    the linked guardian_user for. One parent, many students — populated at
    admission acceptance (apps.admissions.services.find_or_create_parent)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Student.objects.select_related("user", "class_arm__school_class", "next_class_arm__school_class").filter(
            guardian_user=request.user, user__is_deleted=False,
        )
        return success(data=StudentSerializer(qs, many=True).data)


def _child_or_403(request, student_id):
    """Same ownership guard as apps.finance._child_or_403: the requesting
    user must be the linked guardian_user for this exact student."""
    student = get_object_or_404(Student, id=student_id)
    if student.guardian_user_id != request.user.id:
        return None
    return student


def _own_student_or_403(request):
    return getattr(request.user, "student_profile", None)


class MyProfileView(APIView):
    """Student Portal > Profile: the logged-in student's own enrollment/bio
    record — view-only (accounts.MeView already covers the identity fields;
    this fills in the Student-table half: class, guardian info, registration
    number). No self-service PATCH exists anywhere for these fields today,
    so this stays read-only rather than half-building an edit flow."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = _own_student_or_403(request)
        if student is None:
            return failure(message="No student profile on this account.", status=403)
        return success(data=StudentSerializer(student).data)


# ------------------------------------------------------ Self-service: Class & Subjects
class MyClassView(APIView):
    """Student Portal > Class & Subjects: the logged-in student's own
    class-arm, its subject assignments, and class teacher — reuses
    ClassAcademicSerializer's exact shaping used by the staff Classes page."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = _own_student_or_403(request)
        if student is None:
            return failure(message="No student profile on this account.", status=403)
        if student.class_arm_id is None:
            return success(data=None)
        session = _current_session()
        arm = ClassArm.objects.select_related("school_class").prefetch_related(
            "subject_assignments__subject", "subject_assignments__teacher", "class_teacher_assignments__teacher",
        ).get(id=student.class_arm_id)
        return success(data=ClassAcademicSerializer(arm, context={"session": session}).data)


class ChildClassView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        student = _child_or_403(request, student_id)
        if student is None:
            return failure(message="Not your child's record.", status=403)
        if student.class_arm_id is None:
            return success(data=None)
        session = _current_session()
        arm = ClassArm.objects.select_related("school_class").prefetch_related(
            "subject_assignments__subject", "subject_assignments__teacher", "class_teacher_assignments__teacher",
        ).get(id=student.class_arm_id)
        return success(data=ClassAcademicSerializer(arm, context={"session": session}).data)


# ------------------------------------------------------ Self-service: Timetable
class MyTimetableView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = _own_student_or_403(request)
        if student is None:
            return failure(message="No student profile on this account.", status=403)
        if student.class_arm_id is None:
            return success(data=[])
        qs = TimetableSlot.objects.filter(class_arm_id=student.class_arm_id).select_related("subject", "teacher", "class_arm")
        return success(data=TimetableSlotSerializer(qs, many=True).data)


class ChildTimetableView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        student = _child_or_403(request, student_id)
        if student is None:
            return failure(message="Not your child's record.", status=403)
        if student.class_arm_id is None:
            return success(data=[])
        qs = TimetableSlot.objects.filter(class_arm_id=student.class_arm_id).select_related("subject", "teacher", "class_arm")
        return success(data=TimetableSlotSerializer(qs, many=True).data)


# ------------------------------------------------------ Self-service: Attendance
class MyAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = _own_student_or_403(request)
        if student is None:
            return failure(message="No student profile on this account.", status=403)
        qs = AttendanceRecord.objects.filter(student=student).select_related("class_arm")
        term = request.query_params.get("term")
        if term:
            qs = qs.filter(term_id=term)
        return success(data=AttendanceRecordSerializer(qs, many=True).data)


class ChildAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        student = _child_or_403(request, student_id)
        if student is None:
            return failure(message="Not your child's record.", status=403)
        qs = AttendanceRecord.objects.filter(student=student).select_related("class_arm")
        term = request.query_params.get("term")
        if term:
            qs = qs.filter(term_id=term)
        return success(data=AttendanceRecordSerializer(qs, many=True).data)


# ------------------------------------------------------ Self-service: Assignments (read-only)
class MyAssignmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = _own_student_or_403(request)
        if student is None:
            return failure(message="No student profile on this account.", status=403)
        if student.class_arm_id is None:
            return success(data=[])
        qs = Assignment.objects.filter(class_arm_id=student.class_arm_id).select_related("subject", "teacher")
        return success(data=AssignmentSerializer(qs, many=True).data)


class ChildAssignmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        student = _child_or_403(request, student_id)
        if student is None:
            return failure(message="Not your child's record.", status=403)
        if student.class_arm_id is None:
            return success(data=[])
        qs = Assignment.objects.filter(class_arm_id=student.class_arm_id).select_related("subject", "teacher")
        return success(data=AssignmentSerializer(qs, many=True).data)


# ---------------------------------------------------------------- Teachers (read summary over Staff)
class TeachersView(APIView):
    """Staff enriched with their current teaching load — subjects taught and
    class-teacher assignments. Staff account CRUD itself stays in Staff
    Management; this is a read-only academic summary over the same users."""

    permission_classes = [HasPermission("teachers.view")]

    def get(self, request):
        session = _current_session()
        staff = User.objects.filter(user_type=User.UserType.STAFF, is_deleted=False, is_active=True).order_by("full_name")
        assignments = ClassSubjectAssignment.objects.filter(session=session).select_related("class_arm", "subject") if session else ClassSubjectAssignment.objects.none()
        class_teacher_of = ClassTeacherAssignment.objects.filter(session=session).select_related("class_arm") if session else ClassTeacherAssignment.objects.none()

        subjects_by_teacher = {}
        for a in assignments:
            subjects_by_teacher.setdefault(a.teacher_id, []).append({"subject": a.subject.name, "class_arm": str(a.class_arm)})
        class_teacher_by_teacher = {}
        for c in class_teacher_of:
            class_teacher_by_teacher.setdefault(c.teacher_id, []).append(str(c.class_arm))

        data = [
            {
                "id": str(t.id),
                "full_name": t.full_name,
                "email": t.email,
                "identifier": t.identifier,
                "subjects_taught": subjects_by_teacher.get(t.id, []),
                "class_teacher_of": class_teacher_by_teacher.get(t.id, []),
            }
            for t in staff
        ]
        return success(data=data, meta={"session": session.name if session else None})


# ---------------------------------------------------------------- Classes (academic view)
class ClassesAcademicView(ClassAcademicPermissionMixin, APIView):
    def get(self, request):
        session = _current_session()
        arms = ClassArm.objects.select_related("school_class").prefetch_related(
            "subject_assignments__subject", "subject_assignments__teacher", "class_teacher_assignments__teacher",
        )
        data = ClassAcademicSerializer(arms, many=True, context={"session": session}).data
        return success(data=data, meta={"session": session.name if session else None})


class ClassSubjectAssignmentsView(ClassAcademicPermissionMixin, ListCreateAPIView):
    write_action = "assign"
    serializer_class = ClassSubjectAssignmentSerializer

    def get_queryset(self):
        return ClassSubjectAssignment.objects.filter(class_arm_id=self.kwargs["arm_id"]).select_related("subject", "teacher")

    def perform_create(self, serializer):
        session = _current_session()
        if not session:
            raise ValidationError("No current academic session is set.")
        assignment = serializer.save(class_arm_id=self.kwargs["arm_id"], session=session)
        log(actor=self.request.user, action="academics.subject_assigned", target=assignment, request=self.request)


class ClassSubjectAssignmentDetailView(ClassAcademicPermissionMixin, RetrieveUpdateDestroyAPIView):
    write_action = "assign"
    serializer_class = ClassSubjectAssignmentSerializer
    queryset = ClassSubjectAssignment.objects.all()
    lookup_url_kwarg = "assignment_id"

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="academics.subject_unassigned", target=instance, request=self.request)
        instance.delete()


class ClassTeacherAssignmentView(ClassAcademicPermissionMixin, APIView):
    """Upsert the class/form teacher for one class-arm this session."""

    write_action = "assign"

    def put(self, request, arm_id):
        session = _current_session()
        if not session:
            raise ValidationError("No current academic session is set.")
        teacher_id = request.data.get("teacher")
        if not teacher_id:
            raise ValidationError({"teacher": ["This field is required."]})
        get_object_or_404(User, id=teacher_id, user_type=User.UserType.STAFF, is_deleted=False)
        assignment, _created = ClassTeacherAssignment.objects.update_or_create(
            class_arm_id=arm_id, session=session, defaults={"teacher_id": teacher_id},
        )
        log(actor=request.user, action="academics.class_teacher_assigned", target=assignment, request=request)
        return success(message="Class teacher assigned.", data=ClassTeacherAssignmentSerializer(assignment).data)


# ---------------------------------------------------------------- Timetable
class TimetableSlotsView(TimetablePermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = TimetableSlotSerializer

    def get_queryset(self):
        qs = TimetableSlot.objects.select_related("subject", "teacher", "class_arm")
        class_arm = self.request.query_params.get("class_arm")
        if class_arm:
            qs = qs.filter(class_arm_id=class_arm)
        return qs

    def perform_create(self, serializer):
        session = _current_session()
        if not session:
            raise ValidationError("No current academic session is set.")
        # unique_together on (class_arm, day, start_time, session) can't be
        # auto-validated by DRF here — session is injected server-side, not
        # client-supplied, so it's outside the serializer's validated data.
        # Check explicitly rather than letting a duplicate hit the DB and
        # surface as a raw IntegrityError.
        conflict = TimetableSlot.objects.filter(
            class_arm=serializer.validated_data["class_arm"],
            day=serializer.validated_data["day"],
            start_time=serializer.validated_data["start_time"],
            session=session,
        ).exists()
        if conflict:
            raise ValidationError({"start_time": ["This class already has a slot at this day and time."]})
        slot = serializer.save(session=session)
        log(actor=self.request.user, action="academics.timetable_slot_created", target=slot, request=self.request)


class TimetableSlotDetailView(TimetablePermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = TimetableSlotSerializer
    queryset = TimetableSlot.objects.all()
    lookup_url_kwarg = "slot_id"

    def perform_update(self, serializer):
        slot = serializer.save()
        log(actor=self.request.user, action="academics.timetable_slot_updated", target=slot, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="academics.timetable_slot_deleted", target=instance, request=self.request)
        instance.delete()


# ---------------------------------------------------------------- Attendance
class AttendanceRecordsView(AttendancePermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = AttendanceRecordSerializer

    def get_queryset(self):
        qs = AttendanceRecord.objects.select_related("student__user", "class_arm")
        class_arm = self.request.query_params.get("class_arm")
        date = self.request.query_params.get("date")
        if class_arm:
            qs = qs.filter(class_arm_id=class_arm)
        if date:
            qs = qs.filter(date=date)
        return qs

    def perform_create(self, serializer):
        record = serializer.save(recorded_by=self.request.user)
        log(actor=self.request.user, action="academics.attendance_recorded", target=record, request=self.request)


class AttendanceBulkMarkView(AttendancePermissionMixin, APIView):
    write_action = "create"

    def post(self, request):
        serializer = AttendanceBulkMarkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        created = 0
        for r in v["records"]:
            AttendanceRecord.objects.update_or_create(
                student_id=r["student"], date=v["date"],
                defaults={
                    "class_arm": v["class_arm"], "term": v["term"],
                    "status": r["status"], "notes": r.get("notes", ""), "recorded_by": request.user,
                },
            )
            created += 1
        log(actor=request.user, action="academics.attendance_bulk_marked",
            changes={"class_arm": str(v["class_arm"]), "date": str(v["date"]), "count": created}, request=request)
        return success(message=f"Attendance recorded for {created} student(s).", data={"count": created})


# ---------------------------------------------------------------- Exams
class ExamsView(ExamPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = ExamSerializer
    queryset = Exam.objects.all()

    def perform_create(self, serializer):
        session = _current_session()
        if not session:
            raise ValidationError("No current academic session is set.")
        term = Term.objects.filter(session=session, is_current=True).first()
        if not term:
            raise ValidationError("No current term is set.")
        exam = serializer.save(session=session, term=term)
        log(actor=self.request.user, action="academics.exam_created", target=exam, request=self.request)


class ExamDetailView(ExamPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = ExamSerializer
    queryset = Exam.objects.all()
    lookup_url_kwarg = "exam_id"

    def perform_update(self, serializer):
        exam = serializer.save()
        log(actor=self.request.user, action="academics.exam_updated", target=exam, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="academics.exam_deleted", target=instance, request=self.request)
        instance.delete()


class ExamPublishView(APIView):
    permission_classes = [HasPermission("results.publish")]

    def post(self, request, exam_id):
        exam = get_object_or_404(Exam, id=exam_id)
        # The actual approval gate: a submission still SUBMITTED means no
        # one has reviewed it yet, and REJECTED means someone explicitly
        # said it isn't right — either way, publishing now would show
        # students scores nobody has signed off on. A class+subject that
        # never went through the submit-for-approval flow at all (scores
        # entered directly by staff) doesn't block publish; only a
        # submission that exists and isn't APPROVED does.
        unresolved = exam.result_submissions.exclude(status=ResultSubmission.Status.APPROVED)
        if unresolved.exists():
            count = unresolved.count()
            return failure(
                message=f"{count} result submission(s) for this exam still need admin approval before it can be published.",
                status=400,
            )
        exam.status = Exam.Status.PUBLISHED
        exam.save(update_fields=["status"])
        log(actor=request.user, action="academics.exam_published", target=exam, request=request)
        # Fire performance-based class-arm reallocation for opted-in classes.
        # The task itself filters: only the configured term-result exam type,
        # only a 1st/2nd-term result (3rd term is promotion's job). Runs
        # eagerly (synchronously) when there's no Redis broker.
        from .tasks import compute_reallocations_for_exam
        compute_reallocations_for_exam.delay(str(exam.id), str(request.user.id))
        return success(message="Results published.", data=ExamSerializer(exam).data)


# ---------------------------------------------------------------- Results / Marksheets
class ExamScoresView(APIView):
    def get_permissions(self):
        return [HasPermission("results.view" if self.request.method == "GET" else "results.enter")]

    def get(self, request, exam_id):
        qs = ExamScore.objects.filter(exam_id=exam_id).select_related("student__user", "subject")
        subject = request.query_params.get("subject")
        class_arm = request.query_params.get("class_arm")
        if subject:
            qs = qs.filter(subject_id=subject)
        if class_arm:
            qs = qs.filter(student__class_arm_id=class_arm)
        return success(data=ExamScoreSerializer(qs, many=True).data)

    def post(self, request, exam_id):
        serializer = ExamScoreBulkEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        count = 0
        for s in v["scores"]:
            ca1_score = s.get("ca1_score")
            ca2_score = s.get("ca2_score")
            exam_score = s.get("exam_score")
            # A CA1/Exam split, when both parts are given, is the source of
            # truth for the total — entering them separately shouldn't also
            # require reconciling a matching "score" value by hand. ca2_score
            # is optional even then: a subject with only one CA this term
            # just contributes 0.
            score = (float(ca1_score) + float(ca2_score or 0) + float(exam_score)) if (ca1_score is not None and exam_score is not None) else s["score"]
            ExamScore.objects.update_or_create(
                exam_id=exam_id, student_id=s["student"], subject=v["subject"],
                defaults={
                    "score": score, "max_score": v["max_score"], "ca1_score": ca1_score, "ca2_score": ca2_score, "exam_score": exam_score,
                    "remark": s.get("remark", ""), "entered_by": request.user,
                },
            )
            count += 1
        log(actor=request.user, action="academics.scores_entered",
            changes={"exam": str(exam_id), "subject": str(v["subject"]), "count": count}, request=request)
        return success(message=f"Scores entered for {count} student(s).", data={"count": count})


class ExamScoreDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = ExamScoreSerializer
    queryset = ExamScore.objects.all()
    lookup_url_kwarg = "score_id"

    def get_permissions(self):
        mapping = {"GET": "results.view", "PATCH": "results.edit", "PUT": "results.edit", "DELETE": "results.edit"}
        return [HasPermission(mapping[self.request.method])]

    def perform_update(self, serializer):
        score = serializer.save()
        log(actor=self.request.user, action="academics.score_updated", target=score, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="academics.score_deleted", target=instance, request=self.request)
        instance.delete()


class MarksheetView(APIView):
    """One student's compiled marksheet for one exam — every subject scored,
    with a computed grade off the school's GradeScale."""

    permission_classes = [HasPermission("results.view")]

    def get(self, request, exam_id, student_id):
        exam = get_object_or_404(Exam, id=exam_id)
        student = get_object_or_404(Student, id=student_id)
        scores = ExamScore.objects.filter(exam=exam, student=student).select_related("subject")
        scales = list(GradeScale.objects.all())

        def grade_for(percentage):
            for scale in scales:
                if scale.min_score <= percentage <= scale.max_score:
                    return {"grade": scale.name, "remark": scale.remark}
            return None

        rows = []
        for s in scores:
            pct = round(float(s.score) / float(s.max_score) * 100, 1) if s.max_score else 0
            rows.append({
                "subject": s.subject.name, "score": s.score, "max_score": s.max_score,
                "percentage": pct, **({"grade_info": grade_for(pct)}),
            })

        return success(data={
            "student": {"id": str(student.id), "name": student.user.full_name, "class_arm": str(student.class_arm) if student.class_arm else None},
            "exam": {"id": str(exam.id), "name": exam.name},
            "subjects": rows,
            "average": round(sum(r["percentage"] for r in rows) / len(rows), 1) if rows else None,
        })


class ExamMarksheetCompilationView(APIView):
    """Exam Officer Portal > Marksheet: one class-arm's whole subject grid
    for one exam — every student × every subject assigned to that class
    this session, missing cells flagged, so the officer can see at a glance
    what's still outstanding before publish. Distinct from MarksheetView
    (one student's own compiled sheet) and ExamScoresView (one subject's
    score list) — this is the class-wide compilation those two don't
    provide on their own."""

    permission_classes = [HasPermission("results.view")]

    def get(self, request, exam_id):
        exam = get_object_or_404(Exam, id=exam_id)
        class_arm_id = request.query_params.get("class_arm")
        if not class_arm_id:
            return failure(message="class_arm is required.", status=400)
        class_arm = get_object_or_404(ClassArm.objects.select_related("school_class"), id=class_arm_id)

        subjects = list(
            Subject.objects.filter(class_assignments__class_arm=class_arm, class_assignments__session=exam.session)
            .distinct().order_by("name")
        )
        students = list(
            Student.objects.filter(class_arm=class_arm, user__is_deleted=False)
            .select_related("user").order_by("user__full_name")
        )

        scores = ExamScore.objects.filter(exam=exam, student__class_arm=class_arm, subject__in=subjects)
        by_student_subject = {(s.student_id, s.subject_id): s for s in scores}

        student_rows = []
        entered_percentages = []
        for student in students:
            cells = []
            percentages = []
            for subject in subjects:
                score = by_student_subject.get((student.id, subject.id))
                if score is None:
                    cells.append(None)
                else:
                    pct = round(float(score.score) / float(score.max_score) * 100, 1) if score.max_score else 0
                    cells.append({"subject": str(subject.id), "score": score.score, "max_score": score.max_score, "percentage": pct})
                    percentages.append(pct)
                    entered_percentages.append(pct)
            complete = len(percentages) == len(subjects) and len(subjects) > 0
            student_rows.append({
                "id": str(student.id),
                "name": student.user.full_name,
                "identifier": student.user.identifier or "",
                "scores": cells,
                "average": round(sum(percentages) / len(percentages), 1) if complete else None,
            })

        expected = len(students) * len(subjects)
        entered = len(entered_percentages)
        return success(data={
            "exam": {"id": str(exam.id), "name": exam.name},
            "class_arm": {"id": str(class_arm.id), "label": str(class_arm)},
            "subjects": [{"id": str(s.id), "name": s.name} for s in subjects],
            "students": student_rows,
            "stats": {
                "total_students": len(students),
                "missing_scores": expected - entered,
                "data_completeness": round(entered / expected * 100, 1) if expected else 0,
                "class_average": round(sum(entered_percentages) / len(entered_percentages), 1) if entered_percentages else None,
            },
        })


class PublishedExamsView(APIView):
    """Every published exam, newest first — the self-service picker behind
    Results/Report Card on both portals. Exams aren't scoped to one student
    (a class-arm's whole cohort sits the same exam), so this doesn't need a
    mine/child split like the other self-service views; ReportCardView still
    enforces per-student ownership on the actual result data."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Exam.objects.filter(status=Exam.Status.PUBLISHED).order_by("-start_date")
        return success(data=ExamSerializer(qs, many=True).data)


def _report_card_access_denied(request, exam, student):
    """Shared by ReportCardView and ReportCardPDFView: staff with
    results.view (including before publish, to proof it), or the owning
    student, or that student's linked guardian — the latter two only once
    the exam has been published, matching the rule that unpublished results
    are a staff-only preview. Returns a failure() response to short-circuit
    on, or None when access is allowed."""
    perms = get_effective_permissions(request.user)
    is_staff_viewer = "*" in perms or "results.view" in perms
    is_owning_student = getattr(request.user, "student_profile", None) and student.user_id == request.user.id
    is_owning_guardian = student.guardian_user_id == request.user.id
    if not (is_staff_viewer or is_owning_student or is_owning_guardian):
        return failure(message="You do not have access to this report card.", status=403)
    if not is_staff_viewer and exam.status != Exam.Status.PUBLISHED:
        return failure(message="Results have not been published yet.", status=403)
    return None


class ReportCardView(APIView):
    """The full compiled report card for one student's exam — CA/Exam split,
    grade, class position, attendance, skills, and remarks. Callable by
    staff with results.view (including before publish, to proof it), by the
    owning student, or by that student's linked guardian — the latter two
    only once the exam has been published, matching the rule that unpublished
    results are a staff-only preview."""

    permission_classes = [IsAuthenticated]

    def get(self, request, exam_id, student_id):
        exam = get_object_or_404(Exam, id=exam_id)
        student = get_object_or_404(Student.objects.select_related("user", "class_arm__school_class", "next_class_arm__school_class"), id=student_id)

        denied = _report_card_access_denied(request, exam, student)
        if denied:
            return denied

        scores = ExamScore.objects.filter(exam=exam, student=student).select_related("subject")
        scales = list(GradeScale.objects.all())

        def grade_for(percentage):
            for scale in scales:
                if scale.min_score <= percentage <= scale.max_score:
                    return scale.name
            return None

        subject_rows = []
        for s in scores:
            pct = round(float(s.score) / float(s.max_score) * 100, 1) if s.max_score else 0
            subject_rows.append({
                "subject": s.subject.name, "ca1_score": s.ca1_score, "ca2_score": s.ca2_score, "exam_score": s.exam_score,
                "total": s.score, "max_score": s.max_score, "percentage": pct,
                "grade": grade_for(pct), "remark": s.remark,
            })
        average = round(sum(r["percentage"] for r in subject_rows) / len(subject_rows), 1) if subject_rows else None

        # Class position/rank is computed at read time off every classmate's
        # average across this exam, not stored — so it can never go stale as
        # scores are edited or new students are added to the class.
        position, class_size = None, 0
        if student.class_arm_id:
            peer_rows = ExamScore.objects.filter(
                exam=exam, student__class_arm_id=student.class_arm_id,
            ).values("student_id", "score", "max_score")
            by_student = {}
            for row in peer_rows:
                pct = float(row["score"]) / float(row["max_score"]) * 100 if row["max_score"] else 0
                by_student.setdefault(row["student_id"], []).append(pct)
            averages = {sid: sum(vals) / len(vals) for sid, vals in by_student.items()}
            ranked = [sid for sid, _ in sorted(averages.items(), key=lambda kv: kv[1], reverse=True)]
            class_size = len(ranked)
            if student.id in ranked:
                position = ranked.index(student.id) + 1

        attendance_qs = AttendanceRecord.objects.filter(student=student, term=exam.term)
        attendance_total = attendance_qs.count()
        attendance_present = attendance_qs.filter(status=AttendanceRecord.Status.PRESENT).count()

        promotion = PromotionRecord.objects.filter(student=student, from_session=exam.session).order_by("-promoted_at").first()
        remark_row = ReportCardRemark.objects.filter(exam=exam, student=student).first()
        skills = list(SkillRating.objects.filter(exam=exam, student=student).values("skill", "rating"))

        return success(data={
            "student": {
                "id": str(student.id), "name": student.user.full_name, "identifier": student.user.identifier,
                "class_arm": str(student.class_arm) if student.class_arm else None,
            },
            "exam": {"id": str(exam.id), "name": exam.name, "session": exam.session.name, "term": exam.term.name, "status": exam.status},
            "subjects": subject_rows,
            "average": average,
            "class_position": position,
            "class_size": class_size,
            "attendance": {"present": attendance_present, "total": attendance_total},
            "status": promotion.get_outcome_display() if promotion else None,
            "skills": skills,
            "class_teacher_remark": remark_row.class_teacher_remark if remark_row else "",
            "principal_remark": remark_row.principal_remark if remark_row else "",
        })


class ReportCardPDFView(APIView):
    """Downloadable PDF of the report card, styled on the legacy system's own
    "Continuous Assessment Report" card (school header, student bios, a
    per-subject class avg/max/min/position table, final analysis, skills,
    and the grading key) — same ownership/publish gate as ReportCardView,
    same server-rendered xhtml2pdf pipeline as finance's payment receipt."""

    permission_classes = [IsAuthenticated]

    def get(self, request, exam_id, student_id):
        from . import services

        exam = get_object_or_404(Exam.objects.select_related("term", "session"), id=exam_id)
        student = get_object_or_404(
            Student.objects.select_related("user", "class_arm__school_class"), id=student_id,
        )

        denied = _report_card_access_denied(request, exam, student)
        if denied:
            return denied

        ctx = services.build_printable_report_card(exam, student)
        profile = ctx["profile"]
        contact_parts = [p for p in [profile.website if profile else "", profile.email if profile else "", profile.phone if profile else ""] if p]

        from apps.settings_app.models import SystemSetting
        appearance = {s.key: s.value for s in SystemSetting.objects.filter(group="appearance", is_secret=False)}

        html = render_to_string("academics/report_card.html", {
            "primary_color": appearance.get("appearance.primary_color") or "#1a237e",
            "secondary_color": appearance.get("appearance.secondary_color") or "#37474f",
            "logo_url": profile.logo if profile else "",
            "photo_url": student.user.avatar or "",
            "school_name": profile.name if profile else "School",
            "school_address": profile.address if profile else "",
            "school_contact": " | ".join(contact_parts),
            "student_name": student.user.full_name,
            "student_identifier": student.user.identifier or "—",
            "class_arm_label": ctx["class_arm_label"],
            "age": ctx["age"],
            "term_name": exam.term.name,
            "session_name": exam.session.name,
            "attendance_present": ctx["attendance_present"],
            "attendance_total": ctx["attendance_total"],
            "class_size": ctx["class_size"],
            "subject_rows": ctx["subject_rows"],
            "passed": ctx["passed"],
            "failed": ctx["failed"],
            "total_subjects": ctx["total_subjects"],
            "total_obtainable": ctx["total_obtainable"],
            "total_obtained": ctx["total_obtained"],
            "class_average": ctx["class_average"],
            "student_average": ctx["student_average"],
            "position": ctx["position"],
            "class_teacher_remark": ctx["class_teacher_remark"],
            "principal_remark": ctx["principal_remark"],
            "principal_signature_url": profile.principal_signature if profile else "",
            "term_ended": ctx["term_ended"].strftime("%d %B %Y") if ctx["term_ended"] else None,
            "next_term_begins": ctx["next_term_begins"].strftime("%d %B %Y") if ctx["next_term_begins"] else None,
            "affective_skills": ctx["affective_skills"],
            "psychomotor_skills": ctx["psychomotor_skills"],
            "grading_key": ctx["grading_key"],
            "generated_at": timezone.now().strftime("%d %b %Y, %I:%M %p"),
        })

        pdf_buffer = HttpResponse(content_type="application/pdf")
        filename = f"report-card-{student.user.identifier or student.id}-{exam.term.name}-{exam.session.name}.pdf".replace("/", "-").replace(" ", "-")
        pdf_buffer["Content-Disposition"] = f'attachment; filename="{filename}"'
        pisa_status = pisa.CreatePDF(html, dest=pdf_buffer)
        if pisa_status.err:
            return HttpResponse("Could not generate report card PDF.", status=500)
        log(actor=request.user, action="academics.report_card_downloaded", target=student, request=request,
            changes={"exam": exam.name})
        return pdf_buffer


class ReportCardRemarkView(APIView):
    """Staff upsert of the report-card narrative remarks + skill ratings for
    one student's exam — the only mutating counterpart to ReportCardView."""

    permission_classes = [HasPermission("results.enter")]

    def put(self, request, exam_id, student_id):
        exam = get_object_or_404(Exam, id=exam_id)
        student = get_object_or_404(Student, id=student_id)
        remark, _created = ReportCardRemark.objects.update_or_create(
            exam=exam, student=student,
            defaults={
                "class_teacher_remark": request.data.get("class_teacher_remark", ""),
                "principal_remark": request.data.get("principal_remark", ""),
            },
        )
        valid_skills = {c.value for c in SkillRating.Skill}
        for skill, rating in (request.data.get("skills") or {}).items():
            if skill in valid_skills:
                SkillRating.objects.update_or_create(exam=exam, student=student, skill=skill, defaults={"rating": rating})
        log(actor=request.user, action="academics.report_card_remarks_set", target=remark, request=request)
        return success(message="Report card saved.")


# ---------------------------------------------------------------- Assignments
class AssignmentsView(AssignmentPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = AssignmentSerializer

    def get_queryset(self):
        qs = Assignment.objects.select_related("subject", "teacher", "class_arm")
        class_arm = self.request.query_params.get("class_arm")
        if class_arm:
            qs = qs.filter(class_arm_id=class_arm)
        return qs

    def perform_create(self, serializer):
        session = _current_session()
        term = Term.objects.filter(session=session, is_current=True).first() if session else None
        assignment = serializer.save(session=session, term=term, teacher=self.request.user)
        log(actor=self.request.user, action="academics.assignment_created", target=assignment, request=self.request)


class AssignmentDetailView(AssignmentPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = AssignmentSerializer
    queryset = Assignment.objects.all()
    lookup_url_kwarg = "assignment_id"

    def perform_update(self, serializer):
        assignment = serializer.save()
        log(actor=self.request.user, action="academics.assignment_updated", target=assignment, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="academics.assignment_deleted", target=instance, request=self.request)
        instance.delete()


# ---------------------------------------------------------------- Promotion
class PromotionRecordsView(APIView):
    permission_classes = [HasPermission("promotion.view")]

    def get(self, request):
        qs = PromotionRecord.objects.select_related("student__user", "from_class_arm", "to_class_arm").all()
        from_class_arm = request.query_params.get("from_class_arm")
        if from_class_arm:
            qs = qs.filter(from_class_arm_id=from_class_arm)
        return success(data=PromotionRecordSerializer(qs, many=True).data)


class PromotionActionView(APIView):
    permission_classes = [HasPermission("promotion.action")]

    def post(self, request):
        serializer = PromotionActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        records = []
        for d in v["decisions"]:
            student = get_object_or_404(Student, id=d["student"])
            to_class_arm = d.get("to_class_arm")
            record = PromotionRecord.objects.create(
                student=student, from_class_arm=v["from_class_arm"], to_class_arm_id=to_class_arm,
                from_session=v["from_session"], to_session=v["to_session"],
                outcome=d["outcome"], promoted_by=request.user,
            )
            if d["outcome"] == PromotionRecord.Outcome.PROMOTED and to_class_arm:
                student.class_arm_id = to_class_arm
                student.save(update_fields=["class_arm"])
            elif d["outcome"] == PromotionRecord.Outcome.GRADUATED:
                student.status = Student.Status.GRADUATED
                student.save(update_fields=["status"])
            elif d["outcome"] == PromotionRecord.Outcome.WITHDRAWN:
                student.status = Student.Status.WITHDRAWN
                student.save(update_fields=["status"])
            records.append(record)
        log(actor=request.user, action="academics.students_promoted",
            changes={"from_class_arm": str(v["from_class_arm"]), "count": len(records)}, request=request)
        return success(message=f"Processed {len(records)} student(s).", data=PromotionRecordSerializer(records, many=True).data)


# ---------------------------------------------------------------- Class-arm reallocation
class BandingConfigView(APIView):
    """List every class's banding config (creating a blank one per class on
    first read so the UI has a row to toggle), and update one class's config
    (enable/disable, set the N_S holding arm)."""

    def get_permissions(self):
        return [HasPermission("reallocation.view" if self.request.method == "GET" else "reallocation.configure")]

    def get(self, request, class_id=None):
        configs = {c.school_class_id: c for c in ClassBandingConfig.objects.select_related("school_class", "holding_arm")}
        rows = []
        for klass in SchoolClass.objects.order_by("level_order"):
            cfg = configs.get(klass.id) or ClassBandingConfig.objects.create(school_class=klass)
            rows.append(ClassBandingConfigSerializer(cfg).data)
        return success(data=rows)

    def patch(self, request, class_id=None):
        if class_id is None:
            return failure(message="PATCH a specific class: /banding-config/<class_id>.", status=400)
        cfg, _ = ClassBandingConfig.objects.get_or_create(school_class_id=class_id)
        serializer = ClassBandingConfigSerializer(cfg, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log(actor=request.user, action="academics.banding_config_updated", target=cfg,
            changes={k: str(v) for k, v in serializer.validated_data.items()}, request=request)
        return success(message="Banding config updated.", data=ClassBandingConfigSerializer(cfg).data)


class ArmCapacityView(APIView):
    """The only manual writer of ClassArm.capacity — behind its own
    permission, and every change is audit-logged (see services.set_arm_capacity)
    so a hand-edit can't quietly bypass the "only N_S absorption raises
    capacity" ratchet."""

    permission_classes = [HasPermission("reallocation.configure")]

    def put(self, request, arm_id):
        from . import services

        arm = get_object_or_404(ClassArm, id=arm_id)
        serializer = ArmCapacitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.set_arm_capacity(arm, serializer.validated_data["capacity"], actor=request.user, request=request)
        return success(message="Capacity updated.", data={"id": str(arm.id), "capacity": arm.capacity})


class ReallocationsView(APIView):
    permission_classes = [HasPermission("reallocation.view")]

    def get(self, request):
        qs = ClassReallocation.objects.select_related(
            "school_class", "session", "term", "source_exam", "computed_by", "released_by", "applied_by",
        ).prefetch_related("moves")
        for param, field in (("school_class", "school_class_id"), ("session", "session_id"),
                             ("term", "term_id"), ("status", "status")):
            value = request.query_params.get(param)
            if value:
                qs = qs.filter(**{field: value})
        return success(data=ClassReallocationSerializer(qs, many=True).data)


class ReallocationDetailView(APIView):
    permission_classes = [HasPermission("reallocation.view")]

    def get(self, request, reallocation_id):
        realloc = get_object_or_404(
            ClassReallocation.objects.select_related("school_class__banding_config", "session", "term", "source_exam")
            .prefetch_related("moves__student__user", "moves__from_arm", "moves__to_arm"),
            id=reallocation_id,
        )
        return success(data=ClassReallocationDetailSerializer(realloc).data)


class ReallocationComputeView(APIView):
    """Manual (re)compute — for administrative correction, or to band a
    freshly promoted cohort (`kind=initial_banding`). The automatic path runs
    off exam publish and needs no permission."""

    permission_classes = [HasPermission("reallocation.configure")]

    def post(self, request):
        from . import services

        serializer = ReallocationComputeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        try:
            if v["kind"] == "initial_banding":
                realloc = services.compute_initial_banding(v["school_class"], v["source_exam"], actor=request.user)
            else:
                realloc = services.compute_reallocation(v["school_class"], v["source_exam"], actor=request.user)
        except services.ReallocationError as e:
            return failure(message=str(e), status=400)
        if realloc is None:
            return failure(
                message="Nothing computed — the class isn't opted in, or this is a 3rd-term result "
                        "(that hands off to promotion).",
                status=400,
            )
        return success(message="Reallocation computed.", data=ClassReallocationDetailSerializer(realloc).data)


class ReallocationReleaseView(APIView):
    permission_classes = [HasPermission("reallocation.release")]

    def post(self, request, reallocation_id):
        from . import services

        realloc = get_object_or_404(ClassReallocation, id=reallocation_id)
        try:
            services.release_reallocation(realloc, actor=request.user)
        except services.ReallocationError as e:
            return failure(message=str(e), status=400)
        return success(message="Reallocation released — students and parents can now see their next arm.",
                       data=ClassReallocationSerializer(realloc).data)


class ReallocationApplyView(APIView):
    permission_classes = [HasPermission("reallocation.apply")]

    def post(self, request, reallocation_id):
        from . import services

        realloc = get_object_or_404(ClassReallocation, id=reallocation_id)
        try:
            services.apply_reallocation(realloc, actor=request.user)
        except services.ReallocationError as e:
            return failure(message=str(e), status=400)
        return success(message="Reallocation applied — students have been moved to their new arm.",
                       data=ClassReallocationSerializer(realloc).data)


# ---------------------------------------------------------------- Academic Reports
class AcademicReportsView(ReportsPermissionMixin, APIView):
    def get(self, request):
        session = _current_session()
        term = Term.objects.filter(session=session, is_current=True).first() if session else None

        classes = SchoolClass.objects.prefetch_related("arms").all()
        headcount_by_class = [
            {"class": c.name, "count": Student.objects.filter(class_arm__school_class=c, status=Student.Status.ACTIVE).count()}
            for c in classes
        ]

        attendance_qs = AttendanceRecord.objects.filter(term=term) if term else AttendanceRecord.objects.none()
        total_attendance = attendance_qs.count()
        present_count = attendance_qs.filter(status=AttendanceRecord.Status.PRESENT).count()
        attendance_rate = round(present_count / total_attendance * 100, 1) if total_attendance else None

        recent_exam = Exam.objects.filter(session=session).order_by("-start_date").first() if session else None
        avg_by_subject = []
        if recent_exam:
            avg_by_subject = list(
                ExamScore.objects.filter(exam=recent_exam)
                .values("subject__name")
                .annotate(avg_score=Avg("score"), entries=Count("id"))
                .order_by("subject__name")
            )

        return success(data={
            "session": session.name if session else None,
            "term": term.name if term else None,
            "total_students": Student.objects.filter(status=Student.Status.ACTIVE).count(),
            "headcount_by_class": headcount_by_class,
            "attendance_rate": attendance_rate,
            "recent_exam": {"id": str(recent_exam.id), "name": recent_exam.name} if recent_exam else None,
            "average_scores_by_subject": [
                {"subject": r["subject__name"], "average": round(r["avg_score"], 1), "entries": r["entries"]}
                for r in avg_by_subject
            ],
        })


# ================================================================ Teacher Portal ("teaching")
# Everything below is the Teacher Portal's self-service layer: scoped to
# "classes/subjects this logged-in staff member actually teaches this
# session", the same way the student/parent "mine"/"child" views above are
# scoped to one student's own record. No academics.* RBAC permission is
# required — IsAuthenticated plus the ownership helpers above is the gate,
# so any staff account works the moment they have a ClassSubjectAssignment
# or ClassTeacherAssignment row, regardless of what admin role they hold.

class MyTeachingClassesView(APIView):
    """Teacher Portal > My Classes: every class-arm this teacher touches
    this session, with which subject(s) they teach there and whether
    they're its form/class teacher."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        session = _current_session()
        arm_ids = _teaching_class_arm_ids(request.user, session)
        if not arm_ids:
            return success(data=[])
        arms = ClassArm.objects.select_related("school_class").filter(id__in=arm_ids)
        my_subject_assignments = ClassSubjectAssignment.objects.filter(
            teacher=request.user, session=session, class_arm_id__in=arm_ids
        ).select_related("subject")
        subjects_by_arm = {}
        for a in my_subject_assignments:
            subjects_by_arm.setdefault(a.class_arm_id, []).append({"id": str(a.subject.id), "name": a.subject.name})
        class_teacher_arm_ids = set(
            ClassTeacherAssignment.objects.filter(teacher=request.user, session=session, class_arm_id__in=arm_ids)
            .values_list("class_arm_id", flat=True)
        )
        data = [
            {
                "id": str(arm.id),
                "name": str(arm),
                "school_class": str(arm.school_class_id),
                "school_class_name": arm.school_class.name,
                "student_count": arm.students.filter(status=Student.Status.ACTIVE).count(),
                "subjects": subjects_by_arm.get(arm.id, []),
                "is_class_teacher": arm.id in class_teacher_arm_ids,
            }
            for arm in arms
        ]
        return success(data=data, meta={"session": session.name if session else None})


class MyTeachingSubjectsView(APIView):
    """Teacher Portal > My Subjects: distinct subjects taught this session,
    each with the class-arms they're taught in."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        session = _current_session()
        assignments = ClassSubjectAssignment.objects.filter(teacher=request.user, session=session).select_related(
            "subject", "class_arm__school_class"
        ) if session else ClassSubjectAssignment.objects.none()
        by_subject = {}
        for a in assignments:
            entry = by_subject.setdefault(a.subject_id, {"id": str(a.subject.id), "name": a.subject.name, "class_arms": []})
            entry["class_arms"].append({"id": str(a.class_arm.id), "name": str(a.class_arm)})
        return success(data=list(by_subject.values()))


class MyTeachingTimetableView(APIView):
    """Teacher Portal > My Timetable: every slot this teacher is timetabled
    to teach this session, across all their classes."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        session = _current_session()
        qs = TimetableSlot.objects.filter(teacher=request.user, session=session).select_related(
            "subject", "class_arm__school_class"
        ) if session else TimetableSlot.objects.none()
        return success(data=TimetableSlotSerializer(qs, many=True).data)


class MyTeachingStudentsView(APIView):
    """Teacher Portal > Student List: roster of one class-arm, only if this
    teacher actually teaches or class-teaches that arm."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        session = _current_session()
        class_arm = request.query_params.get("class_arm")
        if not class_arm:
            return failure(message="class_arm is required.", status=400)
        if class_arm not in {str(i) for i in _teaching_class_arm_ids(request.user, session)}:
            return failure(message="Not one of your classes.", status=403)
        qs = Student.objects.select_related("user", "class_arm__school_class", "next_class_arm__school_class").filter(
            class_arm_id=class_arm, user__is_deleted=False,
        )
        return success(data=StudentSerializer(qs, many=True).data)


class MyTeachingAttendanceView(APIView):
    """Teacher Portal > Attendance: view/take attendance for one of my
    classes on one date. GET returns the roster's current marks (defaulting
    to 'present' if unmarked yet); POST bulk-marks the whole roster."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        session = _current_session()
        class_arm = request.query_params.get("class_arm")
        date = request.query_params.get("date")
        if not class_arm or not date:
            return failure(message="class_arm and date are required.", status=400)
        if class_arm not in {str(i) for i in _teaching_class_arm_ids(request.user, session)}:
            return failure(message="Not one of your classes.", status=403)
        roster = Student.objects.select_related("user").filter(class_arm_id=class_arm, user__is_deleted=False, status=Student.Status.ACTIVE)
        marks = {
            r.student_id: r.status
            for r in AttendanceRecord.objects.filter(class_arm_id=class_arm, date=date)
        }
        data = [
            {"id": str(s.id), "full_name": s.user.full_name, "status": marks.get(s.id, AttendanceRecord.Status.PRESENT)}
            for s in roster
        ]
        return success(data=data)

    def post(self, request):
        session = _current_session()
        class_arm = request.data.get("class_arm")
        date = request.data.get("date")
        records = request.data.get("records")
        if not class_arm or not date or not records:
            return failure(message="class_arm, date and records are required.", status=400)
        if class_arm not in {str(i) for i in _teaching_class_arm_ids(request.user, session)}:
            return failure(message="Not one of your classes.", status=403)
        term = Term.objects.filter(session=session, is_current=True).first() if session else None
        if not term:
            return failure(message="No current term is set.", status=400)
        valid_statuses = {c.value for c in AttendanceRecord.Status}
        count = 0
        for r in records:
            if r.get("status") not in valid_statuses or not r.get("student"):
                continue
            AttendanceRecord.objects.update_or_create(
                student_id=r["student"], date=date,
                defaults={"class_arm_id": class_arm, "term": term, "status": r["status"], "recorded_by": request.user},
            )
            count += 1
        log(actor=request.user, action="academics.attendance_bulk_marked",
            changes={"class_arm": str(class_arm), "date": str(date), "count": count}, request=request)
        return success(message=f"Attendance recorded for {count} student(s).", data={"count": count})


class MyTeachingAssignmentsView(APIView):
    """Teacher Portal > Assignments: assignments I've set, and creating new
    ones for a class/subject I actually teach."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Assignment.objects.filter(teacher=request.user).select_related("subject", "class_arm__school_class").order_by("-due_date")
        return success(data=AssignmentSerializer(qs, many=True).data)

    def post(self, request):
        session = _current_session()
        class_arm = request.data.get("class_arm")
        subject = request.data.get("subject")
        if not _teaches_subject_in_arm(request.user, session, class_arm, subject):
            return failure(message="You don't teach that subject in that class.", status=403)
        serializer = AssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        term = Term.objects.filter(session=session, is_current=True).first() if session else None
        assignment = serializer.save(session=session, term=term, teacher=request.user)
        log(actor=request.user, action="academics.assignment_created", target=assignment, request=request)
        return success(message="Assignment created.", data=AssignmentSerializer(assignment).data, status=201)


class MyTeachingAssignmentDetailView(APIView):
    """Edit/withdraw one of my own assignments."""

    permission_classes = [IsAuthenticated]

    def _own_or_404(self, request, assignment_id):
        assignment = get_object_or_404(Assignment, id=assignment_id)
        return assignment if assignment.teacher_id == request.user.id else None

    def patch(self, request, assignment_id):
        assignment = self._own_or_404(request, assignment_id)
        if assignment is None:
            return failure(message="Not your assignment.", status=403)
        serializer = AssignmentSerializer(assignment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        assignment = serializer.save()
        log(actor=request.user, action="academics.assignment_updated", target=assignment, request=request)
        return success(message="Assignment updated.", data=AssignmentSerializer(assignment).data)

    def delete(self, request, assignment_id):
        assignment = self._own_or_404(request, assignment_id)
        if assignment is None:
            return failure(message="Not your assignment.", status=403)
        log(actor=request.user, action="academics.assignment_deleted", target=assignment, request=request)
        assignment.delete()
        return success(message="Assignment removed.")


class MyTeachingExamsView(APIView):
    """Teacher Portal > exam picker for Tests & CA / Exams / Marks Entry —
    every exam in the current session (any type/status: a teacher needs to
    enter scores before an exam is marked completed, not just after)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        session = _current_session()
        qs = Exam.objects.filter(session=session).order_by("-start_date") if session else Exam.objects.none()
        exam_type = request.query_params.get("exam_type")
        if exam_type:
            qs = qs.filter(exam_type=exam_type)
        return success(data=ExamSerializer(qs, many=True).data)


class MyTeachingScoresView(APIView):
    """Teacher Portal > Tests & CA / Exams / Marks Entry: enter scores for
    one exam+class+subject I actually teach. GET also reports whether this
    slice has already been submitted for approval."""

    permission_classes = [IsAuthenticated]

    def get(self, request, exam_id):
        session = _current_session()
        subject = request.query_params.get("subject")
        class_arm = request.query_params.get("class_arm")
        if not subject or not class_arm:
            return failure(message="subject and class_arm are required.", status=400)
        if not _teaches_subject_in_arm(request.user, session, class_arm, subject):
            return failure(message="You don't teach that subject in that class.", status=403)
        qs = ExamScore.objects.filter(exam_id=exam_id, subject_id=subject, student__class_arm_id=class_arm).select_related("student__user")
        submission = ResultSubmission.objects.filter(exam_id=exam_id, class_arm_id=class_arm, subject_id=subject).first()
        return success(data={
            "scores": ExamScoreSerializer(qs, many=True).data,
            "submission": ResultSubmissionSerializer(submission).data if submission else None,
        })

    def post(self, request, exam_id):
        session = _current_session()
        subject = request.data.get("subject")
        class_arm = request.data.get("class_arm")
        if not _teaches_subject_in_arm(request.user, session, class_arm, subject):
            return failure(message="You don't teach that subject in that class.", status=403)
        submitted = ResultSubmission.objects.filter(
            exam_id=exam_id, class_arm_id=class_arm, subject_id=subject,
        ).exclude(status=ResultSubmission.Status.REJECTED).exists()
        if submitted:
            return failure(message="These scores were already submitted for approval — ask an admin to reopen them before editing.", status=409)
        serializer = ExamScoreBulkEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        count = 0
        for s in v["scores"]:
            ca1_score = s.get("ca1_score")
            ca2_score = s.get("ca2_score")
            exam_score = s.get("exam_score")
            score = (float(ca1_score) + float(ca2_score or 0) + float(exam_score)) if (ca1_score is not None and exam_score is not None) else s["score"]
            ExamScore.objects.update_or_create(
                exam_id=exam_id, student_id=s["student"], subject=v["subject"],
                defaults={
                    "score": score, "max_score": v["max_score"], "ca1_score": ca1_score, "ca2_score": ca2_score, "exam_score": exam_score,
                    "remark": s.get("remark", ""), "entered_by": request.user,
                },
            )
            count += 1
        log(actor=request.user, action="academics.scores_entered",
            changes={"exam": str(exam_id), "subject": str(v["subject"]), "count": count}, request=request)
        return success(message=f"Scores entered for {count} student(s).", data={"count": count})


class MyTeachingResultSubmitView(APIView):
    """Teacher Portal > Results: lock in one class+subject's scores for
    this exam and send them to the HOD/principal for approval. Submitting
    doesn't publish results to students; it only stops the teacher (and
    this endpoint) from editing further. If a prior submission for this
    exact class+subject was rejected, resubmitting reopens the SAME row
    (unique_together on exam/class_arm/subject means there's only ever one)
    rather than getting permanently stuck behind the old "Already
    submitted" — a rejection is meant to be fixable, not final."""

    permission_classes = [IsAuthenticated]

    def post(self, request, exam_id):
        session = _current_session()
        subject = request.data.get("subject")
        class_arm = request.data.get("class_arm")
        if not _teaches_subject_in_arm(request.user, session, class_arm, subject):
            return failure(message="You don't teach that subject in that class.", status=403)
        if not ExamScore.objects.filter(exam_id=exam_id, subject_id=subject, student__class_arm_id=class_arm).exists():
            return failure(message="Enter at least one score before submitting.", status=400)
        submission, created = ResultSubmission.objects.get_or_create(
            exam_id=exam_id, class_arm_id=class_arm, subject_id=subject,
            defaults={"teacher": request.user, "status": ResultSubmission.Status.SUBMITTED},
        )
        if not created:
            if submission.status != ResultSubmission.Status.REJECTED:
                return failure(message="Already submitted.", status=409)
            submission.status = ResultSubmission.Status.SUBMITTED
            submission.teacher = request.user
            submission.submitted_at = timezone.now()
            submission.reviewed_by = None
            submission.reviewed_at = None
            submission.review_note = ""
            submission.save(update_fields=["status", "teacher", "submitted_at", "reviewed_by", "reviewed_at", "review_note"])
        log(actor=request.user, action="academics.results_submitted", target=submission, request=request)
        return success(message="Results submitted for approval.", data=ResultSubmissionSerializer(submission).data)


class MyTeachingDashboardView(APIView):
    """Teacher Portal > Dashboard: my classes, today's timetable, pending
    tasks (attendance not yet taken today, assignments due soon), and the
    same active site announcements every portal shows."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        session = _current_session()
        arm_ids = _teaching_class_arm_ids(request.user, session)
        today = timezone.localdate()
        today_slots = TimetableSlot.objects.filter(
            teacher=request.user, session=session, day=today.strftime("%A").lower(),
        ).select_related("subject", "class_arm__school_class").order_by("start_time") if session else TimetableSlot.objects.none()

        marked_today = set(
            AttendanceRecord.objects.filter(class_arm_id__in=arm_ids, date=today).values_list("class_arm_id", flat=True)
        )
        arms = ClassArm.objects.select_related("school_class").filter(id__in=arm_ids)
        pending_attendance = [
            {"id": str(a.id), "name": str(a)} for a in arms if a.id not in marked_today
        ]

        upcoming_assignments = Assignment.objects.filter(
            teacher=request.user, due_date__gte=today,
        ).select_related("subject", "class_arm__school_class").order_by("due_date")[:5]

        return success(data={
            "session": session.name if session else None,
            "class_count": len(arm_ids),
            "today_timetable": TimetableSlotSerializer(today_slots, many=True).data,
            "pending_attendance": pending_attendance,
            "upcoming_assignments": AssignmentSerializer(upcoming_assignments, many=True).data,
        })


# ================================================================ Principal Portal: Results Approval
class PendingResultSubmissionsView(APIView):
    """Principal Portal > Approvals: every teacher's class+subject result
    submission still awaiting sign-off — the results half of the Approvals
    inbox (admissions applications are the other half, see apps.admissions)."""

    permission_classes = [HasPermission("results.approve")]

    def get(self, request):
        qs = ResultSubmission.objects.filter(status=ResultSubmission.Status.SUBMITTED).select_related(
            "exam", "class_arm__school_class", "subject", "teacher",
        )
        return success(data=ResultSubmissionSerializer(qs, many=True).data)


class ResultSubmissionReviewView(APIView):
    """Approve or reject one teacher's submitted class+subject results.
    Rejecting keeps the row (status=rejected) rather than deleting it —
    ExamPublishView needs to still see it as "not approved yet" so a
    rejected slice can't slip through unpublished-but-uncaught, and the
    teacher's MarksEntryView needs the row to unlock editing and to show
    why it was rejected. MyTeachingResultSubmitView.post is what reopens
    this same row (get_or_create finds it) when the teacher resubmits.
    Approving doesn't publish results to students by itself; publishing
    the exam as a whole stays ExamPublishView's job, once every submission
    for it looks good."""

    permission_classes = [HasPermission("results.approve")]

    def post(self, request, submission_id):
        submission = get_object_or_404(ResultSubmission, id=submission_id)
        outcome = request.data.get("status")
        if outcome not in (ResultSubmission.Status.APPROVED, ResultSubmission.Status.REJECTED):
            raise ValidationError({"status": ["Must be 'approved' or 'rejected'."]})
        if submission.status != ResultSubmission.Status.SUBMITTED:
            raise ValidationError("Only a pending submission can be reviewed.")

        submission.status = outcome
        submission.reviewed_by = request.user
        submission.reviewed_at = timezone.now()
        submission.review_note = request.data.get("review_note", "")
        submission.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_note"])

        log(actor=request.user, action=f"academics.results_{outcome}", target=submission, request=request)
        return success(message=f"Results {outcome}.", data=ResultSubmissionSerializer(submission).data)


class PrincipalDashboardView(APIView):
    """Principal Portal > Dashboard: school-wide stats — students, staff,
    today's attendance, fees, and upcoming exams — pulled from academics,
    finance, and accounts rather than duplicated into a new table."""

    permission_classes = [HasPermission("dashboard.view")]

    def get(self, request):
        from apps.finance.models import Invoice, Payment

        session = _current_session()
        today = timezone.localdate()

        total_students = Student.objects.filter(status=Student.Status.ACTIVE).count()
        total_staff = User.objects.filter(user_type=User.UserType.STAFF, is_deleted=False, is_active=True).count()

        today_attendance = AttendanceRecord.objects.filter(date=today)
        present_today = today_attendance.filter(status=AttendanceRecord.Status.PRESENT).count()
        absent_today = today_attendance.filter(status=AttendanceRecord.Status.ABSENT).count()

        total_invoiced = Invoice.objects.aggregate(total=Sum("amount"))["total"] or 0
        total_discounted = sum((inv.total_discount for inv in Invoice.objects.all()), start=0)
        total_collected = Payment.objects.filter(status=Payment.Status.COMPLETED).aggregate(total=Sum("amount"))["total"] or 0
        outstanding = (total_invoiced - total_discounted) - total_collected

        upcoming_exams = Exam.objects.filter(session=session, start_date__gte=today).order_by("start_date")[:5] if session else Exam.objects.none()
        pending_approvals = ResultSubmission.objects.filter(status=ResultSubmission.Status.SUBMITTED).count()

        return success(data={
            "session": session.name if session else None,
            "total_students": total_students,
            "total_staff": total_staff,
            "present_today": present_today,
            "absent_today": absent_today,
            "fees_collected": total_collected,
            "fees_outstanding": outstanding,
            "pending_approvals": pending_approvals,
            "upcoming_exams": ExamSerializer(upcoming_exams, many=True).data,
        })
