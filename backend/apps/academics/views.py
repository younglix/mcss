from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView

from apps.audit.services import log
from apps.configuration.models import AcademicSession, ClassArm, GradeScale, SchoolClass, Term
from apps.rbac.permissions import HasPermission
from common.responses import success

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
from .serializers import (
    AssignmentSerializer,
    AttendanceBulkMarkSerializer,
    AttendanceRecordSerializer,
    ClassAcademicSerializer,
    ClassSubjectAssignmentSerializer,
    ClassTeacherAssignmentSerializer,
    ExamScoreBulkEntrySerializer,
    ExamScoreSerializer,
    ExamSerializer,
    PromotionActionSerializer,
    PromotionRecordSerializer,
    StudentCreateSerializer,
    StudentSerializer,
    SubjectSerializer,
    TimetableSlotSerializer,
)

User = get_user_model()


def _current_session():
    return AcademicSession.objects.filter(is_current=True).first()


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
        qs = Student.objects.select_related("user", "class_arm").filter(user__is_deleted=False)
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
    queryset = Student.objects.select_related("user", "class_arm").filter(user__is_deleted=False)

    def perform_update(self, serializer):
        student = serializer.save()
        log(actor=self.request.user, action="academics.student_updated", target=student, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="academics.student_withdrawn", target=instance, request=self.request)
        instance.user.soft_delete()
        instance.user.is_active = False
        instance.user.save(update_fields=["is_active"])


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
        exam.status = Exam.Status.PUBLISHED
        exam.save(update_fields=["status"])
        log(actor=request.user, action="academics.exam_published", target=exam, request=request)
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
            ExamScore.objects.update_or_create(
                exam_id=exam_id, student_id=s["student"], subject=v["subject"],
                defaults={"score": s["score"], "max_score": v["max_score"], "remark": s.get("remark", ""), "entered_by": request.user},
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
