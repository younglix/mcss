from celery import shared_task
from django.utils import timezone

from . import services
from .models import Attempt, Exam


@shared_task
def sweep_expired_attempts():
    """Belt & braces: force-submits any attempt whose deadline has passed
    but is still 'in_progress' — covers a student whose browser never got
    to fire the exit call (lost wifi, laptop died) rather than the exam
    officer's own toggle-off catching it. Runs frequently since exam
    durations are short (minutes, not hours)."""
    stale = Attempt.objects.filter(status=Attempt.Status.IN_PROGRESS, deadline__lt=timezone.now()).select_related("exam")
    exams_touched = set()
    count = 0
    for attempt in stale:
        services.grade_attempt(attempt, final_status=Attempt.Status.AUTO_SUBMITTED_TIMEOUT)
        exams_touched.add(attempt.exam_id)
        count += 1
    # Only sync scores for exams still ACTIVE — an already-ENDED exam's
    # attempts were synced once at end() already; re-syncing here is
    # harmless (update_or_create) but pointless for ones untouched since.
    for exam_id in exams_touched:
        exam = Exam.objects.filter(id=exam_id, status=Exam.Status.ACTIVE).first()
        if exam:
            services.sync_scores_to_academic_exam(exam)
    return count
