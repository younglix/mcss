from celery import shared_task
from django.contrib.auth import get_user_model

from . import services
from .models import Exam


@shared_task
def compute_reallocations_for_exam(exam_id, actor_id=None):
    """Fired when an exam is published. Computes a PENDING class-arm
    reallocation proposal for every opted-in class in that exam's session —
    but only when the exam is the configured term-result type and it's a
    1st/2nd-term result (a 3rd-term result hands off to promotion; the
    service returns nothing for it). Nothing is released or applied here.
    """
    exam = Exam.objects.filter(id=exam_id).select_related("session", "term").first()
    if not exam:
        return 0
    actor = get_user_model().objects.filter(id=actor_id).first() if actor_id else None
    return len(services.compute_reallocations_for_published_exam(exam, actor=actor))


@shared_task
def apply_due_reallocations():
    """Auto-apply: any released reallocation whose target (next) term has
    started. Idempotent — safe to run on a schedule."""
    return services.apply_due_reallocations()
