from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.academics.models import Student
from apps.audit.services import log
from apps.rbac.permissions import HasPermission
from common.responses import failure, success

from . import services
from .auth import IsExamSession, issue_exam_session_token
from .models import Attempt, Exam, Question, QuestionBank
from .parser import parse_questions
from .serializers import (
    AttemptSerializer,
    AttemptTakeSerializer,
    ExamActivateResponseSerializer,
    ExamSerializer,
    QuestionBankDetailSerializer,
    QuestionBankSerializer,
    QuestionSerializer,
)

User = get_user_model()


class EnvelopeMixin:
    """The generic ListCreateAPIView/RetrieveUpdateDestroyAPIView methods
    below (retrieve/create/update) return raw serializer data by default —
    only a paginated list or an explicit success()/failure() call gets the
    {success, message, data} envelope every other response in this API
    carries. That's a harmless, long-standing inconsistency elsewhere in
    this codebase (nothing there relies on a bare create/retrieve's body),
    but this app's frontend genuinely needs the created/fetched object back
    synchronously — starting to add questions to a bank, or activating an
    exam, right after creating it — so every view here gets a consistently
    wrapped response instead of repeating this per class."""

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success(data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return success(data=serializer.data, status=201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return success(data=serializer.data)


def _permission_mixin(action_for_write):
    """Every exam.* view here needs its own write action (they're not a
    uniform view/create/edit/delete shape) — this just standardizes the
    GET->exam.view branch, matching the codebase-wide mixin pattern."""

    class Mixin:
        def get_permissions(self):
            code = "exam.view" if self.request.method in ("GET", "HEAD", "OPTIONS") else f"exam.{action_for_write}"
            return [HasPermission(code)]

    return Mixin


BankSubmitPermissionMixin = _permission_mixin("questions_submit")
BankApprovePermissionMixin = _permission_mixin("bank_approve")
ConfigPermissionMixin = _permission_mixin("config_edit")


class ExamTermsView(APIView):
    """Just the current session's terms — a Teacher can see exam.view but
    not the full config.* surface /config/sessions needs, and authoring a
    QuestionBank (which is term-scoped) still needs *some* permitted way to
    pick one. Deliberately narrower than the admin sessions endpoint."""

    permission_classes = [HasPermission("exam.view")]

    def get(self, request):
        from apps.configuration.models import AcademicSession
        from apps.configuration.serializers import TermSerializer

        session = AcademicSession.objects.filter(is_current=True).first()
        terms = session.terms.all() if session else []
        return success(data=TermSerializer(terms, many=True).data)


# ================================================================ Question Banks
class QuestionBanksView(EnvelopeMixin, BankSubmitPermissionMixin, ListCreateAPIView):
    serializer_class = QuestionBankSerializer

    def get_queryset(self):
        qs = QuestionBank.objects.select_related("subject", "school_class", "term", "approved_by")
        for param, field in (("subject", "subject_id"), ("school_class", "school_class_id"), ("term", "term_id")):
            value = self.request.query_params.get(param)
            if value:
                qs = qs.filter(**{field: value})
        return qs

    def perform_create(self, serializer):
        bank = serializer.save()
        log(actor=self.request.user, action="examinations.bank_created", target=bank, request=self.request)


class QuestionBankDetailView(EnvelopeMixin, BankSubmitPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = QuestionBankDetailSerializer
    queryset = QuestionBank.objects.all()
    lookup_url_kwarg = "bank_id"


class QuestionBankSubmitView(APIView):
    """Teacher pastes free-text questions; parsed and appended to the bank.
    Any edit to an already-approved bank revokes its approval — no silent
    changes to something already signed off."""

    permission_classes = [HasPermission("exam.questions_submit")]

    def post(self, request, bank_id):
        bank = get_object_or_404(QuestionBank, id=bank_id)
        raw = request.data.get("raw_text", "")
        parsed, errors = parse_questions(raw)
        if not parsed and errors:
            return failure(message="No questions could be parsed.", errors={"raw_text": errors}, status=400)

        created = [
            Question.objects.create(bank=bank, author=request.user, **q)
            for q in parsed
        ]
        bank.revoke_approval()
        log(actor=request.user, action="examinations.questions_submitted", target=bank,
            changes={"created": len(created), "errors": len(errors)}, request=request)
        return success(
            message=f"Added {len(created)} question(s)." + (f" {len(errors)} block(s) had errors." if errors else ""),
            data={"created": QuestionSerializer(created, many=True).data, "errors": errors},
            status=201,
        )


class QuestionDetailView(EnvelopeMixin, BankSubmitPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = QuestionSerializer
    queryset = Question.objects.all()
    lookup_url_kwarg = "question_id"

    def perform_update(self, serializer):
        question = serializer.save()
        question.bank.revoke_approval()
        log(actor=self.request.user, action="examinations.question_updated", target=question, request=self.request)

    def perform_destroy(self, instance):
        bank = instance.bank
        log(actor=self.request.user, action="examinations.question_deleted", target=instance, request=self.request)
        instance.delete()
        bank.revoke_approval()


class QuestionBankApproveView(APIView):
    permission_classes = [HasPermission("exam.bank_approve")]

    def post(self, request, bank_id):
        bank = get_object_or_404(QuestionBank, id=bank_id)
        ok, message = services.can_approve_bank(bank)
        if not ok:
            return failure(message=message, status=400)
        bank.is_approved = True
        bank.approved_by = request.user
        bank.approved_at = timezone.now()
        bank.save(update_fields=["is_approved", "approved_by", "approved_at"])
        log(actor=request.user, action="examinations.bank_approved", target=bank, request=request)
        return success(message="Bank approved.", data=QuestionBankSerializer(bank).data)


# ================================================================ CBE Exams (config)
class ExamsView(EnvelopeMixin, ConfigPermissionMixin, ListCreateAPIView):
    serializer_class = ExamSerializer

    def get_queryset(self):
        qs = Exam.objects.select_related("subject", "school_class", "class_arm", "academic_exam", "bank")
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    def perform_create(self, serializer):
        bank = serializer.validated_data.get("bank")
        if bank and not bank.is_approved:
            raise ValidationError({"bank": ["This question bank isn't approved yet."]})
        exam = serializer.save(created_by=self.request.user)
        log(actor=self.request.user, action="examinations.exam_created", target=exam, request=self.request)


class ExamDetailView(EnvelopeMixin, ConfigPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = ExamSerializer
    queryset = Exam.objects.all()
    lookup_url_kwarg = "exam_id"

    def perform_update(self, serializer):
        if serializer.instance.status != Exam.Status.DRAFT:
            raise ValidationError("Only a draft (not yet activated) exam can be reconfigured.")
        exam = serializer.save()
        log(actor=self.request.user, action="examinations.exam_updated", target=exam, request=self.request)

    def perform_destroy(self, instance):
        if instance.status != Exam.Status.DRAFT:
            raise ValidationError("Only a draft exam can be deleted.")
        log(actor=self.request.user, action="examinations.exam_deleted", target=instance, request=self.request)
        instance.delete()


class ExamActivateView(APIView):
    permission_classes = [HasPermission("exam.activate")]

    def post(self, request, exam_id):
        exam = get_object_or_404(Exam, id=exam_id)
        if exam.status == Exam.Status.ENDED:
            return failure(message="This exam has already ended.", status=400)
        if not exam.bank.is_approved:
            return failure(message="The question bank isn't approved yet.", status=400)
        exam.activate()
        log(actor=request.user, action="examinations.exam_activated", target=exam, request=request)
        _broadcast_officer_update(exam)
        return success(message="Exam is live. Share the access code in the hall.", data=ExamActivateResponseSerializer(exam).data)


class ExamEndView(APIView):
    """Toggling off does three things: the code expires, any still-open
    attempt is force-submitted as a timeout, and graded scores sync into
    the linked academics exam — from there the normal results.approve /
    results.publish review takes over, same as manually-entered scores."""

    permission_classes = [HasPermission("exam.activate")]

    def post(self, request, exam_id):
        exam = get_object_or_404(Exam, id=exam_id)
        if exam.status != Exam.Status.ACTIVE:
            return failure(message="This exam isn't currently active.", status=400)
        force_submitted = services.force_submit_open_attempts(exam)
        exam.end()
        synced = services.sync_scores_to_academic_exam(exam)
        log(actor=request.user, action="examinations.exam_ended", target=exam,
            changes={"force_submitted": force_submitted, "synced": synced}, request=request)
        _broadcast_exam_ended(exam)
        return success(message=f"Exam ended. {force_submitted} attempt(s) auto-submitted, {synced} score(s) synced.", data=ExamSerializer(exam).data)


# ================================================================ Officer monitor
class ExamMonitorView(APIView):
    """Live snapshot for the Exam Officer's monitor view — who's writing,
    who's submitted. Polled by the frontend; also pushed on state changes
    via _broadcast_officer_update (role.exam_officer channel)."""

    permission_classes = [HasPermission("exam.monitor")]

    def get(self, request, exam_id):
        exam = get_object_or_404(Exam, id=exam_id)
        attempts = exam.attempts.exclude(status=Attempt.Status.RESET).select_related("student__user")
        return success(data={
            "exam": ExamSerializer(exam).data,
            "attempts": AttemptSerializer(attempts, many=True).data,
            "writing_count": attempts.filter(status=Attempt.Status.IN_PROGRESS).count(),
            "submitted_count": attempts.exclude(status=Attempt.Status.IN_PROGRESS).count(),
        })


class AttemptResetView(APIView):
    """Officer-only clean-slate reset for a genuine technical failure — the
    old attempt is kept (status=reset) as history, not deleted; the
    student's next Start Attempt draws a brand-new random set."""

    permission_classes = [HasPermission("exam.attempt_reset")]

    def post(self, request, attempt_id):
        attempt = get_object_or_404(Attempt, id=attempt_id)
        if attempt.status == Attempt.Status.RESET:
            return failure(message="This attempt was already reset.", status=400)
        reason = request.data.get("reason", "")
        attempt.status = Attempt.Status.RESET
        attempt.reset_by = request.user
        attempt.reset_reason = reason
        attempt.save(update_fields=["status", "reset_by", "reset_reason"])
        log(actor=request.user, action="examinations.attempt_reset", target=attempt,
            changes={"reason": reason}, request=request)
        return success(message="Attempt reset — the student can start fresh.", data=AttemptSerializer(attempt).data)


# ================================================================ Student: access + attempt
def _broadcast_officer_update(exam):
    from apps.realtime.services import push_to_role
    push_to_role("exam_officer", {"kind": "exam.monitor_update", "examId": str(exam.id)})


def _broadcast_exam_ended(exam):
    from apps.realtime.services import push_to_role
    push_to_role("exam_officer", {"kind": "exam.monitor_update", "examId": str(exam.id)})
    # Every open exam client is listening on their own user channel too —
    # push there so a still-open tab disables the instant this fires,
    # not on next manual refresh.
    from apps.realtime.services import push_to_user
    for student_id in exam.attempts.values_list("student__user_id", flat=True).distinct():
        push_to_user(student_id, {"kind": "exam.ended", "examId": str(exam.id)})


class ExamAccessLoginView(APIView):
    """Student ID + the exam's live access code — not the student's normal
    portal password. Only works while the exam is ACTIVE and the code
    matches exactly; issues a short-lived token scoped to just this exam
    (see auth.issue_exam_session_token / IsExamSession)."""

    permission_classes = [AllowAny]

    def post(self, request):
        student_id = (request.data.get("student_id") or "").strip()
        exam_id = request.data.get("exam_id")
        access_code = (request.data.get("access_code") or "").strip().upper()
        if not access_code:
            return failure(message="Enter the access code.", status=400)

        # exam_id is optional — nobody in an exam hall is typing a UUID. The
        # code alone resolves to whichever exam is currently ACTIVE with it;
        # activate() only ever hands out a code to one live exam at a time
        # (see its collision guard), so this is unambiguous in practice.
        if exam_id:
            exam = get_object_or_404(Exam, id=exam_id)
        else:
            exam = Exam.objects.filter(status=Exam.Status.ACTIVE, access_code=access_code).first()
            if not exam:
                return failure(message="Incorrect or expired access code.", status=403)
        if exam.status != Exam.Status.ACTIVE:
            return failure(message="This exam isn't currently open.", status=403)
        if not exam.access_code or access_code != exam.access_code:
            return failure(message="Incorrect or expired access code.", status=403)

        student = Student.objects.filter(user__identifier=student_id, user__is_deleted=False).select_related("user").first()
        if not student:
            return failure(message="Student ID not found.", status=404)
        if student.class_arm and student.class_arm.school_class_id != exam.school_class_id:
            return failure(message="This exam isn't for your class.", status=403)
        if exam.class_arm_id and student.class_arm_id != exam.class_arm_id:
            return failure(message="This exam isn't for your class arm.", status=403)

        token = issue_exam_session_token(student.user, exam)
        log(actor=student.user, action="examinations.access_login", target=exam, request=request)
        return success(data={"access_token": token, "student_name": student.user.full_name, "exam": ExamSerializer(exam).data})


class AttemptStartView(APIView):
    """Starts (or resumes) this student's attempt on the exam they just
    logged into. If a live attempt already exists (a page refresh mid-exam,
    not a reset), it's resumed rather than redrawn — a fresh random set is
    only ever drawn once per non-reset attempt."""

    permission_classes = [IsAuthenticated, IsExamSession]

    def post(self, request, exam_id):
        exam = get_object_or_404(Exam, id=exam_id)
        student = getattr(request.user, "student_profile", None)
        if student is None:
            return failure(message="No student profile on this account.", status=403)
        if exam.status != Exam.Status.ACTIVE:
            return failure(message="This exam is no longer open.", status=403)

        existing = Attempt.objects.filter(exam=exam, student=student).exclude(status=Attempt.Status.RESET).first()
        if existing:
            if existing.status != Attempt.Status.IN_PROGRESS:
                return failure(message="You've already submitted this exam.", status=409)
            attempt = existing
        else:
            attempt = services.start_attempt(exam, student)
            log(actor=request.user, action="examinations.attempt_started", target=attempt, request=request)
        return success(data=AttemptTakeSerializer(attempt).data)


class AttemptAnswerView(APIView):
    """Autosave — fired on every option pick, so a disconnect never loses
    prior work; whatever's saved here is exactly what gets graded on any
    auto-submit."""

    permission_classes = [IsAuthenticated, IsExamSession]

    def post(self, request, attempt_id):
        attempt = get_object_or_404(Attempt, id=attempt_id, student__user=request.user)
        if attempt.status != Attempt.Status.IN_PROGRESS:
            return failure(message="This attempt is no longer open.", status=409)
        question_id = str(request.data.get("question_id"))
        chosen = request.data.get("answer")
        if question_id not in attempt.question_ids or chosen not in ("A", "B", "C", "D"):
            return failure(message="Invalid question or answer.", status=400)
        attempt.answers[question_id] = chosen
        attempt.save(update_fields=["answers"])
        return success(message="Saved.")


class AttemptSubmitView(APIView):
    """Manual submit — clean, no penalty, but only if it's genuinely still
    within time. Nothing here previously checked the deadline, so a client
    could call this any time up to a minute after time runs out (the sweep
    task's own cadence — see tasks.sweep_expired_attempts) and still land a
    penalty-free "clean" submit purely by being faster than the sweep. The
    deadline is what actually decides which grading applies, never which
    endpoint the client happened to call."""

    permission_classes = [IsAuthenticated, IsExamSession]

    def post(self, request, attempt_id):
        attempt = get_object_or_404(Attempt, id=attempt_id, student__user=request.user)
        if attempt.status != Attempt.Status.IN_PROGRESS:
            return failure(message="This attempt is no longer open.", status=409)
        final_status = Attempt.Status.AUTO_SUBMITTED_TIMEOUT if timezone.now() > attempt.deadline else Attempt.Status.SUBMITTED
        services.grade_attempt(attempt, final_status=final_status)
        log(actor=request.user, action="examinations.attempt_submitted", target=attempt,
            changes={"final_status": final_status}, request=request)
        message = "Submitted." if final_status == Attempt.Status.SUBMITTED else "Time was already up — this was recorded as a timeout."
        return success(message=message)


class AttemptExitView(APIView):
    """Fired by the browser the instant it detects the student left the
    page (visibilitychange/blur/beforeunload) — per the warning screen
    they acknowledged, leaving is an immediate penalty, no second chance
    prompt. The server times and applies this, not the client, so nothing
    about the penalty is something a tampered client could dodge."""

    permission_classes = [IsAuthenticated, IsExamSession]

    def post(self, request, attempt_id):
        attempt = get_object_or_404(Attempt, id=attempt_id, student__user=request.user)
        if attempt.status != Attempt.Status.IN_PROGRESS:
            return success(message="Already closed.")  # not an error — submit/timeout may have already landed
        services.grade_attempt(attempt, final_status=Attempt.Status.AUTO_SUBMITTED_EXIT)
        log(actor=request.user, action="examinations.attempt_exited", target=attempt, request=request)
        return success(message="Recorded.")
