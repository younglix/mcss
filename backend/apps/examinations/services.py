import random

from django.utils import timezone

from .models import Attempt


def get_min_bank_size():
    from apps.settings_app.models import SystemSetting

    setting = SystemSetting.objects.filter(key="exam.min_bank_size").first()
    try:
        return int(setting.value) if setting else 150
    except (TypeError, ValueError):
        return 150


def can_approve_bank(bank):
    count = bank.questions.count()
    minimum = get_min_bank_size()
    if count < minimum:
        return False, f"Bank has {count} question(s); minimum {minimum} required."
    return True, ""


def start_attempt(exam, student):
    """Draws this student's random subset — plain random.sample/shuffle, not
    AI: it has to be instant and free with hundreds of students hitting
    Start at once, and there's nothing to be smart about in picking a
    uniform random sample."""
    question_ids = list(exam.bank.questions.values_list("id", flat=True))
    picked = random.sample(question_ids, min(exam.questions_per_student, len(question_ids)))
    random.shuffle(picked)
    return Attempt.objects.create(
        exam=exam, student=student,
        question_ids=[str(qid) for qid in picked],
        started_at=timezone.now(),
        deadline=timezone.now() + timezone.timedelta(minutes=exam.duration_minutes),
        status=Attempt.Status.IN_PROGRESS,
    )


def grade_attempt(attempt, *, final_status):
    """Scores whatever's in attempt.answers as of now, applies the
    auto-submit penalty if this isn't a clean manual submit, and marks the
    attempt done. Never shown to the student directly — release into
    results is a separate, later step (see sync_scores_to_academic_exam)."""
    from .models import Question

    correct_by_id = {
        str(q.id): q.correct_option
        for q in Question.objects.filter(id__in=attempt.question_ids)
    }
    correct_count = sum(1 for qid, chosen in attempt.answers.items() if correct_by_id.get(qid) == chosen)

    raw = correct_count
    penalty = 0
    if final_status in (Attempt.Status.AUTO_SUBMITTED_TIMEOUT, Attempt.Status.AUTO_SUBMITTED_EXIT):
        penalty = attempt.exam.auto_submit_penalty
        raw = max(0, raw - penalty)

    attempt.raw_score = raw
    attempt.penalty_applied = penalty
    attempt.status = final_status
    attempt.submitted_at = timezone.now()
    attempt.save(update_fields=["raw_score", "penalty_applied", "status", "submitted_at"])
    return attempt


def force_submit_open_attempts(exam, *, reason_status=Attempt.Status.AUTO_SUBMITTED_TIMEOUT):
    """Grades every attempt on this CBE sitting still in progress — called
    when the exam is ended (a still-open attempt is exactly the "ran out of
    time" case) and by the periodic deadline sweep (belt & braces for a
    student whose browser never got to fire the exit call, e.g. lost wifi)."""
    open_attempts = exam.attempts.filter(status=Attempt.Status.IN_PROGRESS)
    count = 0
    for attempt in open_attempts:
        grade_attempt(attempt, final_status=reason_status)
        count += 1
    return count


def sync_scores_to_academic_exam(exam):
    """Writes each graded attempt's raw score into the existing
    academics.ExamScore.exam_score for exam.academic_exam — this is the
    only bridge into the report-card/results-approval system already
    built; nothing about publishing or approval is reimplemented here.
    A submission still needs a teacher's results.approve/results.publish
    review through the normal path before a student/parent ever sees it."""
    from apps.academics.models import ExamScore

    graded = exam.attempts.exclude(status__in=[Attempt.Status.IN_PROGRESS, Attempt.Status.RESET])
    synced = 0
    for attempt in graded:
        existing = ExamScore.objects.filter(exam=exam.academic_exam, student=attempt.student, subject=exam.subject).first()
        ca_score = existing.ca_score if existing else None
        exam_score = attempt.raw_score
        score = (float(ca_score) + float(exam_score)) if ca_score is not None else exam_score
        # max_score is the subject's whole-exam scale (CA + exam combined,
        # typically 100 — see ExamScoreBulkEntrySerializer's own default),
        # not this CBE sitting's own total_marks — only set it when there's
        # no existing row to respect instead, so a CA already entered under
        # a wider scale doesn't get silently reinterpreted.
        max_score = existing.max_score if existing else 100
        ExamScore.objects.update_or_create(
            exam=exam.academic_exam, student=attempt.student, subject=exam.subject,
            defaults={
                "score": score, "max_score": max_score, "exam_score": exam_score,
                "ca_score": ca_score, "remark": existing.remark if existing else "",
            },
        )
        synced += 1
    return synced
