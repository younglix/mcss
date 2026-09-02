"""Exam-session auth: Student ID + the exam's live access code, issued as a
short-lived JWT scoped to one exam — deliberately not the student's normal
portal password, and not usable as a general portal session even though it
authenticates as their real account (nothing else in the portal is a risk
surface a student shouldn't already reach).

Reuses rest_framework_simplejwt (already the app's auth backbone) rather
than inventing a second signing scheme — a raw AccessToken with one extra
claim, checked by IsExamSession below."""

from datetime import timedelta

from rest_framework.permissions import BasePermission
from rest_framework_simplejwt.tokens import AccessToken

EXAM_CLAIM = "exam_session_exam_id"


def issue_exam_session_token(user, exam):
    token = AccessToken.for_user(user)
    token[EXAM_CLAIM] = str(exam.id)
    token.set_exp(lifetime=timedelta(minutes=exam.duration_minutes + 15))
    return str(token)


class IsExamSession(BasePermission):
    """Only a token issued by ExamAccessLoginView for *this* exam may pass —
    a normal portal login's token has no exam claim at all and is rejected
    here regardless of what else it's allowed to do. Some views key their
    URL by exam_id directly (starting an attempt); others key it by
    attempt_id (answering/submitting/exiting one already in progress), so
    the exam_id has to be resolved from the attempt in that case."""

    message = "This isn't a valid exam session for this exam."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated or not request.auth:
            return False
        exam_id = view.kwargs.get("exam_id")
        if exam_id is None and "attempt_id" in view.kwargs:
            from .models import Attempt
            exam_id = Attempt.objects.filter(id=view.kwargs["attempt_id"]).values_list("exam_id", flat=True).first()
        return exam_id is not None and str(request.auth.get(EXAM_CLAIM)) == str(exam_id)
