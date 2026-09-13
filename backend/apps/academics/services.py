"""Class-arm performance-based reallocation.

The one subtle thing to hold onto: there are TWO mechanisms, and they must
never be mixed.

  1. rerank_existing_students — for students already in a band (A/B/C). A pure
     SWAP. Re-rank everyone by term average, refill the SAME fixed slots
     top-down. Capacities are frozen: occupants change, counts don't. Nobody
     new enters, nobody's arm-count changes.

  2. absorb_new_students — for N_S (new-intake) students who now have their
     first term average. Purely ADDITIVE. Each one drops into whichever
     band's CURRENT score range (measured AFTER the re-rank) contains their
     average; that band's capacity RATCHETS UP by 1 to fit them. Nobody
     already in a band is displaced or downgraded — this only ever appends.

  Capacity is a ratchet. Mechanism (1) never touches it. Mechanism (2) only
  ever raises it. The single other writer is set_arm_capacity() — a human
  correction through the reallocation.configure endpoint, which audit-logs
  every change so a hand-edit can't quietly break the rule.

  initial_banding is the cold-start path: a class where nobody is banded yet
  — a brand-new class, or a cohort that just arrived via promotion. Rank
  everyone with a result, fill A -> B -> C top-down by configured capacity,
  or an even split when capacities are unset.

Lifecycle — three steps, deliberately not collapsed:

  compute_reallocation  builds a PENDING ClassReallocation of proposed moves.
                        Writes NOTHING to Student or ClassArm.
  release_reallocation  makes the proposal visible: sets Student.next_class_arm.
                        Still nothing physically moved — the current term
                        runs on in the existing arms.
  apply_reallocation    the ONLY place the physical move (next_class_arm ->
                        class_arm) and the capacity ratchet actually happen.
                        Fires at the next term's start.
"""

from datetime import date
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.audit.services import log
from apps.configuration.models import ClassArm, Term

from .models import (
    ClassBandingConfig,
    ClassReallocation,
    ClassReallocationMove,
    Exam,
    ExamScore,
    Student,
)

# ---------------------------------------------------------------------------
# Where a new student's average lands in the GAP between two bands' ranges —
# e.g. 77.5 when B tops out at 77 and A starts at 78 — which band do they
# join? "higher" -> the better band. This is the single switch: flip this one
# line to change the rule school-wide.
GAP_BAND_TIE_BREAK = "higher"  # "higher" | "lower"

_NEG = Decimal("-1")  # sort key for "no average" — always ranks last


class ReallocationError(Exception):
    """Raised when a compute/release/apply can't proceed for a business reason
    (surfaced by the views as a 400)."""


# ---------------------------------------------------------------------------
# Shared metric
# ---------------------------------------------------------------------------
def student_term_averages(exam, student_ids=None):
    """{student_id: Decimal average} across every subject the student has an
    ExamScore for in this exam — the unweighted mean of score/max_score*100.

    This is the same metric ReportCardView uses for class position; it is the
    canonical "student's term average" and the ranking key for reallocation.
    Students with no scores for this exam are simply absent from the result.
    """
    rows = ExamScore.objects.filter(exam=exam)
    if student_ids is not None:
        rows = rows.filter(student_id__in=list(student_ids))
    rows = rows.values("student_id", "score", "max_score")

    pcts = {}
    for row in rows:
        mx = float(row["max_score"]) if row["max_score"] else 0
        pct = (float(row["score"]) / mx * 100) if mx else 0
        pcts.setdefault(row["student_id"], []).append(pct)
    return {sid: Decimal(str(round(sum(v) / len(v), 2))) for sid, v in pcts.items()}


def _avg_or_neg(averages, student_id):
    a = averages.get(student_id)
    return a if a is not None else _NEG


# ---------------------------------------------------------------------------
# Arm helpers
# ---------------------------------------------------------------------------
def banded_arms(school_class, config):
    """The ranked bands of a class, best -> worst. Every arm of the class
    except the N_S holding arm, ordered by name (A, B, C, ...)."""
    holding_id = config.holding_arm_id
    arms = [a for a in school_class.arms.all() if a.id != holding_id]
    return sorted(arms, key=lambda a: a.name)


def _slot_count(arm, current_occupancy):
    """How many seats this band offers for a re-rank. The configured capacity
    is authoritative (that's what "the fixed slots" means); when it's unset we
    fall back to who is currently sitting there."""
    return arm.capacity if arm.capacity is not None else current_occupancy


def arm_score_ranges(assignments, averages):
    """{arm_id: (min_avg, max_avg)} derived live from the averages of whoever
    is assigned to each arm. Arms with no gradeable member are absent."""
    by_arm = {}
    for student, arm_id in assignments:
        a = averages.get(student.id)
        if a is None:
            continue
        by_arm.setdefault(arm_id, []).append(a)
    return {arm_id: (min(v), max(v)) for arm_id, v in by_arm.items()}


def place_by_range(avg, ranked_bands, ranges):
    """Which band does `avg` belong to, given each band's live (min, max)?
    `ranked_bands` is best -> worst. Handles above-top, below-bottom, and the
    between-two-ranges gap (via GAP_BAND_TIE_BREAK)."""
    ranged = [(arm, ranges[arm.id]) for arm in ranked_bands if arm.id in ranges]
    if not ranged:
        return ranked_bands[0]

    top_arm, (_, top_max) = ranged[0]
    if avg >= top_max:
        return top_arm
    bot_arm, (bot_min, _) = ranged[-1]
    if avg <= bot_min:
        return bot_arm

    for i, (arm, (lo, hi)) in enumerate(ranged):
        if lo <= avg <= hi:
            return arm
        if avg > hi:
            # gap: above this band's ceiling, below the previous (higher)
            # band's floor. i > 0 is guaranteed here (avg < top_max).
            higher = ranged[i - 1][0]
            return higher if GAP_BAND_TIE_BREAK == "higher" else arm
    return bot_arm


# ---------------------------------------------------------------------------
# Mechanism 1 — performance re-rank (SWAP ONLY, capacities frozen)
# ---------------------------------------------------------------------------
def rerank_existing_students(existing, averages, bands):
    """MECHANISM 1. Students already in a band, re-sorted by term average into
    the SAME set of slots. This is a pure swap: a student rising into A's band
    displaces A's lowest down to B, and so on. Slot counts come from each
    band's capacity (or current occupancy if uncapped) and are NOT changed
    here — no capacity field is written, and the per-arm head-count is
    identical before and after.

    A student in a band with no score for this term is left exactly where
    they are (their seat is reserved), not demoted for not sitting.
    """
    occupancy = {arm.id: sum(1 for s in existing if s.class_arm_id == arm.id) for arm in bands}

    gradeable = sorted(
        (s for s in existing if averages.get(s.id) is not None),
        key=lambda s: (-_avg_or_neg(averages, s.id), s.user.full_name),
    )
    ungradeable = [s for s in existing if averages.get(s.id) is None]

    # Build the slot list, then remove one slot per ungradeable student from
    # their own current band (that seat is theirs, untouched).
    slots = []
    for arm in bands:
        slots += [arm.id] * _slot_count(arm, occupancy[arm.id])
    reserved = {}
    for s in ungradeable:
        reserved[s.class_arm_id] = reserved.get(s.class_arm_id, 0) + 1
    trimmed = []
    for arm_id in slots:
        if reserved.get(arm_id, 0) > 0:
            reserved[arm_id] -= 1
            continue
        trimmed.append(arm_id)

    moves = []
    last_band_id = bands[-1].id
    for i, student in enumerate(gradeable):
        target_id = trimmed[i] if i < len(trimmed) else last_band_id
        moves.append({
            "student": student,
            "from_arm_id": student.class_arm_id,
            "to_arm_id": target_id,
            "mechanism": ClassReallocationMove.Mechanism.RERANK,
            "term_average": averages.get(student.id),
            "rank": i + 1,
            "capacity_delta": 0,
        })
    return moves


# ---------------------------------------------------------------------------
# Mechanism 2 — N_S absorption (ADDITIVE ONLY, capacity ratchets up)
# ---------------------------------------------------------------------------
def absorb_new_students(new_intake, averages, bands, ranges):
    """MECHANISM 2. New-intake students who now have a first term average,
    dropped into whichever band's CURRENT range (measured after mechanism 1
    has already re-sorted the existing students) contains their average.

    Each move carries capacity_delta = +1: at apply time that band's capacity
    ratchets up to fit them. Nobody already in a band is read, moved, or
    displaced here — this function only ever appends.

    A new-intake student still without any result stays in N_S: no move.
    """
    moves = []
    for student in new_intake:
        avg = averages.get(student.id)
        if avg is None:
            continue
        target = place_by_range(avg, bands, ranges)
        moves.append({
            "student": student,
            "from_arm_id": student.class_arm_id,
            "to_arm_id": target.id,
            "mechanism": ClassReallocationMove.Mechanism.NS_ABSORPTION,
            "term_average": avg,
            "rank": None,
            "capacity_delta": 1,
        })
    return moves


# ---------------------------------------------------------------------------
# Cold start — initial banding (brand-new class, or a promoted cohort)
# ---------------------------------------------------------------------------
def initial_banding(students, averages, bands):
    """Nobody is banded yet. Rank everyone with a result and fill A -> B -> C
    top-down by each band's configured capacity. If not every band has a
    capacity set, split as evenly as possible instead (remainder to the top
    bands).

    Also serves the post-promotion case: a freshly promoted cohort arrives as
    a fresh cohort for its new class and is banded on the results it carried
    up — same logic, no separate mechanism.
    """
    ranked = sorted(
        (s for s in students if averages.get(s.id) is not None),
        key=lambda s: (-_avg_or_neg(averages, s.id), s.user.full_name),
    )
    n = len(ranked)

    caps = [arm.capacity for arm in bands]
    if all(c is not None for c in caps):
        slots = []
        for arm in bands:
            slots += [arm.id] * arm.capacity
    else:
        k = len(bands)
        base, rem = divmod(n, k)
        slots = []
        for idx, arm in enumerate(bands):
            slots += [arm.id] * (base + (1 if idx < rem else 0))

    moves = []
    last_band_id = bands[-1].id
    for i, student in enumerate(ranked):
        target_id = slots[i] if i < len(slots) else last_band_id
        moves.append({
            "student": student,
            "from_arm_id": student.class_arm_id,
            "to_arm_id": target_id,
            "mechanism": ClassReallocationMove.Mechanism.INITIAL_BANDING,
            "term_average": averages.get(student.id),
            "rank": i + 1,
            "capacity_delta": 0,
        })
    return moves


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------
def _next_term_in_session(term):
    """The term after this one, same session. None for the last (3rd) term —
    that boundary is promotion's job, not reallocation's."""
    return (
        Term.objects.filter(session_id=term.session_id, start_date__gt=term.start_date)
        .order_by("start_date")
        .first()
    )


def _persist_moves(reallocation, move_dicts):
    ClassReallocationMove.objects.bulk_create([
        ClassReallocationMove(
            reallocation=reallocation,
            student=m["student"],
            from_arm_id=m["from_arm_id"],
            to_arm_id=m["to_arm_id"],
            mechanism=m["mechanism"],
            term_average=m["term_average"],
            rank=m["rank"],
            capacity_delta=m["capacity_delta"],
        )
        for m in move_dicts
    ])


@transaction.atomic
def compute_reallocation(school_class, source_exam, *, actor=None):
    """Build (or rebuild) the PENDING reallocation proposal for one class off
    one term's results. Idempotent: a prior PENDING proposal for the same
    class+term is superseded and replaced. Refuses if a RELEASED-but-unapplied
    one is in the way. Writes nothing to Student or ClassArm.

    Returns the ClassReallocation, or None if the class isn't opted in or this
    is a 3rd-term result (no next term in the session).
    """
    config = ClassBandingConfig.objects.filter(school_class=school_class, enabled=True).select_related("holding_arm").first()
    if not config or config.holding_arm_id is None:
        return None

    term = source_exam.term
    session = source_exam.session
    if _next_term_in_session(term) is None:
        # 3rd term / year-end — hand off to promotion; banding of the promoted
        # cohort happens afterwards via compute_initial_banding().
        return None

    if ClassReallocation.objects.filter(
        school_class=school_class, session=session, term=term,
        status=ClassReallocation.Status.RELEASED,
    ).exists():
        raise ReallocationError(
            "A released reallocation for this class and term is still awaiting apply. "
            "Apply or supersede it before recomputing."
        )

    ClassReallocation.objects.filter(
        school_class=school_class, session=session, term=term,
        status=ClassReallocation.Status.PENDING,
    ).update(status=ClassReallocation.Status.SUPERSEDED, updated_at=timezone.now())

    bands = banded_arms(school_class, config)
    students = list(
        Student.objects.filter(
            class_arm__school_class=school_class, status=Student.Status.ACTIVE,
        ).select_related("user", "class_arm")
    )
    holding_id = config.holding_arm_id
    existing = [s for s in students if s.class_arm_id and s.class_arm_id != holding_id]
    new_intake = [s for s in students if s.class_arm_id == holding_id]

    averages = student_term_averages(source_exam, [s.id for s in students])

    reallocation = ClassReallocation.objects.create(
        school_class=school_class, session=session, term=term, source_exam=source_exam,
        computed_by=actor,
    )

    if not any(averages.get(s.id) is not None for s in existing):
        # Nobody in the bands has a result to rank on -> cold start. Band
        # everyone (existing placeholders + new intake) from scratch.
        moves = initial_banding(existing + new_intake, averages, bands)
    else:
        moves = rerank_existing_students(existing, averages, bands)
        # Live ranges are measured on the arms AS RE-RANKED, not as they stand
        # now — that's the true current banding the new students slot into.
        post_rerank = [(m["student"], m["to_arm_id"]) for m in moves]
        # existing ungradeable students keep their seat; include them in ranges
        assigned_ids = {m["student"].id for m in moves}
        post_rerank += [(s, s.class_arm_id) for s in existing if s.id not in assigned_ids]
        ranges = arm_score_ranges(post_rerank, averages)
        moves += absorb_new_students(new_intake, averages, bands, ranges)

    _persist_moves(reallocation, move_dicts=moves)

    log(
        actor=actor, action="academics.reallocation_computed", target=reallocation,
        changes={
            "class": school_class.name, "session": session.name, "term": term.name,
            "source_exam": source_exam.name,
            "moves": len(moves),
            "rerank": sum(1 for m in moves if m["mechanism"] == ClassReallocationMove.Mechanism.RERANK),
            "ns_absorption": sum(1 for m in moves if m["mechanism"] == ClassReallocationMove.Mechanism.NS_ABSORPTION),
            "initial_banding": sum(1 for m in moves if m["mechanism"] == ClassReallocationMove.Mechanism.INITIAL_BANDING),
        },
    )
    return reallocation


@transaction.atomic
def compute_initial_banding(school_class, source_exam, *, actor=None):
    """Band a class from scratch on `source_exam`'s results — the entry point
    for a freshly promoted cohort (call after promotion completes) or a
    brand-new class's first-ever term. Same PENDING -> release -> apply gate
    as compute_reallocation; every move is mechanism=initial_banding.
    """
    config = ClassBandingConfig.objects.filter(school_class=school_class, enabled=True).select_related("holding_arm").first()
    if not config:
        return None

    term = source_exam.term
    session = source_exam.session

    if ClassReallocation.objects.filter(
        school_class=school_class, session=session, term=term,
        status__in=[ClassReallocation.Status.RELEASED],
    ).exists():
        raise ReallocationError(
            "A released reallocation for this class and term is still awaiting apply."
        )
    ClassReallocation.objects.filter(
        school_class=school_class, session=session, term=term,
        status=ClassReallocation.Status.PENDING,
    ).update(status=ClassReallocation.Status.SUPERSEDED, updated_at=timezone.now())

    bands = banded_arms(school_class, config)
    students = list(
        Student.objects.filter(
            class_arm__school_class=school_class, status=Student.Status.ACTIVE,
        ).select_related("user", "class_arm")
    )
    averages = student_term_averages(source_exam, [s.id for s in students])

    reallocation = ClassReallocation.objects.create(
        school_class=school_class, session=session, term=term, source_exam=source_exam,
        computed_by=actor, notes="Initial banding",
    )
    moves = initial_banding(students, averages, bands)
    _persist_moves(reallocation, move_dicts=moves)

    log(
        actor=actor, action="academics.reallocation_computed", target=reallocation,
        changes={"class": school_class.name, "term": term.name, "kind": "initial_banding", "moves": len(moves)},
    )
    return reallocation


@transaction.atomic
def release_reallocation(reallocation, *, actor):
    """Step 2. Make the proposal visible: set every moved student's
    next_class_arm. Students and parents can now see where they're headed. The
    physical move does NOT happen here — class_arm is untouched, the current
    term runs on unchanged.
    """
    if reallocation.status != ClassReallocation.Status.PENDING:
        raise ReallocationError(f"Only a pending reallocation can be released (this one is {reallocation.status}).")

    moves = list(reallocation.moves.select_related(
        "student__user", "student__guardian_user", "to_arm__school_class", "from_arm",
    ))
    for m in moves:
        if m.to_arm_id and m.to_arm_id != m.from_arm_id:
            m.student.next_class_arm_id = m.to_arm_id
            m.student.save(update_fields=["next_class_arm", "updated_at"])

    reallocation.status = ClassReallocation.Status.RELEASED
    reallocation.released_by = actor
    reallocation.released_at = timezone.now()
    reallocation.save(update_fields=["status", "released_by", "released_at", "updated_at"])

    log(
        actor=actor, action="academics.reallocation_released", target=reallocation,
        changes={"class": reallocation.school_class.name, "term": reallocation.term.name, "moves": len(moves)},
    )
    _notify_released(reallocation, moves)
    return reallocation


@transaction.atomic
def apply_reallocation(reallocation, *, actor=None):
    """Step 3. The physical move. next_class_arm -> class_arm for every student,
    then clear next_class_arm; ratchet each band's capacity up by the summed
    capacity_delta of the N_S students it absorbed. `actor` is None when this
    ran automatically at the term's start.

    Safe to call once. A second call is a no-op (status guard).
    """
    if reallocation.status != ClassReallocation.Status.RELEASED:
        raise ReallocationError(f"Only a released reallocation can be applied (this one is {reallocation.status}).")

    moves = list(reallocation.moves.select_related("student", "to_arm"))

    for m in moves:
        if m.to_arm_id and m.to_arm_id != m.from_arm_id:
            student = m.student
            student.class_arm_id = m.to_arm_id
            student.next_class_arm = None
            student.save(update_fields=["class_arm", "next_class_arm", "updated_at"])
        elif m.student.next_class_arm_id:
            m.student.next_class_arm = None
            m.student.save(update_fields=["next_class_arm", "updated_at"])

    # Capacity ratchet — N_S absorption only. Sum the +1s per destination arm.
    deltas = {}
    for m in moves:
        if m.capacity_delta:
            deltas[m.to_arm_id] = deltas.get(m.to_arm_id, 0) + m.capacity_delta
    for arm in ClassArm.objects.filter(id__in=deltas):
        if arm.capacity is None:
            # First time capacity matters for this band: seed it from the
            # head-count it now has (already includes the absorbed students) —
            # the correct ratchet floor.
            arm.capacity = arm.students.filter(status=Student.Status.ACTIVE).count()
        else:
            arm.capacity = arm.capacity + deltas[arm.id]
        arm.save(update_fields=["capacity", "updated_at"])

    reallocation.status = ClassReallocation.Status.APPLIED
    reallocation.applied_by = actor
    reallocation.applied_at = timezone.now()
    reallocation.save(update_fields=["status", "applied_by", "applied_at", "updated_at"])

    log(
        actor=actor, action="academics.reallocation_applied", target=reallocation,
        changes={
            "class": reallocation.school_class.name, "term": reallocation.term.name,
            "moves": sum(1 for m in moves if m.to_arm_id and m.to_arm_id != m.from_arm_id),
            "capacity_ratchets": {str(k): v for k, v in deltas.items()},
            "automated": actor is None,
        },
    )
    return reallocation


def set_arm_capacity(arm, new_capacity, *, actor, request=None):
    """The only manual writer of ClassArm.capacity — a genuine administrative
    correction (setting initial capacities, fixing an error). Every edit is
    audit-logged so a hand-edit can't silently violate the "only N_S
    absorption raises capacity" ratchet without a trace.
    """
    old = arm.capacity
    arm.capacity = new_capacity
    arm.save(update_fields=["capacity", "updated_at"])
    log(
        actor=actor, action="academics.arm_capacity_edited", target=arm,
        changes={"arm": str(arm), "from": old, "to": new_capacity}, request=request,
    )
    return arm


# ---------------------------------------------------------------------------
# Trigger + auto-apply
# ---------------------------------------------------------------------------
def _trigger_exam_type():
    from apps.settings_app.models import SystemSetting

    setting = SystemSetting.objects.filter(key="reallocation.trigger_exam_type").first()
    return (setting.value if setting else None) or Exam.ExamType.FINAL


def compute_reallocations_for_published_exam(exam, *, actor=None):
    """Called when an exam is published. Fires reallocation for every opted-in
    class in that exam's session — but only for the configured term-result
    exam type, and only for 1st/2nd term (a 3rd-term result is promotion's
    job; compute_reallocation returns None for it anyway).
    """
    if exam.exam_type != _trigger_exam_type():
        return []
    if _next_term_in_session(exam.term) is None:
        return []

    results = []
    configs = ClassBandingConfig.objects.filter(enabled=True).select_related("school_class")
    for config in configs:
        try:
            realloc = compute_reallocation(config.school_class, exam, actor=actor)
        except ReallocationError:
            # A released-unapplied proposal is blocking this class — skip it,
            # don't fail the whole publish. It'll be picked up on a manual
            # recompute once the blocker clears.
            continue
        if realloc:
            results.append(realloc)
    return results


def apply_due_reallocations():
    """Backstop for the auto-apply: any RELEASED reallocation whose target
    term has started. Idempotent."""
    today = timezone.localdate()
    due = ClassReallocation.objects.filter(status=ClassReallocation.Status.RELEASED).select_related("term", "session")
    applied = 0
    for realloc in due:
        nxt = _next_term_in_session(realloc.term)
        if nxt and nxt.start_date <= today:
            apply_reallocation(realloc, actor=None)
            applied += 1
    return applied


def _notify_released(reallocation, moves):
    """Tell each moved student (and their linked guardian) where they'll be
    next term. Purely informational — the move isn't live yet."""
    from apps.notifications.services import dispatch
    from apps.realtime.services import push_to_role

    real_moves = [m for m in moves if m.to_arm_id and m.to_arm_id != m.from_arm_id]
    for m in real_moves:
        student = m.student
        dispatch(
            recipient=student.user,
            title="Class arm update",
            body=f"From next term you will be in {m.to_arm}. This takes effect when the new term begins.",
            category="academic",
        )
        if student.guardian_user_id and student.guardian_user_id != student.user_id:
            dispatch(
                recipient=student.guardian_user,
                title="Class arm update",
                body=f"{student.user.full_name} will be in {m.to_arm} from next term.",
                category="academic",
            )

    push_to_role("principal", {"kind": "reallocation.released", "reallocationId": str(reallocation.id)})


# ---------------------------------------------------------------------------
# Printable report card — the downloadable PDF
# ---------------------------------------------------------------------------
def build_printable_report_card(exam, student):
    """Everything the printable/PDF report card template needs for one
    student's one exam, laid out to match the legacy system's per-student
    "Continuous Assessment Report" card: per-subject class avg/max/min/
    position (not just this student's own row, which is all the in-app
    Results page shows), the school-wide grading key, attendance, age, and
    the surrounding term dates.

    Deliberately a separate function from ReportCardView's inline
    computation rather than a refactor of it — same core numbers, same
    "unweighted mean of score/max_score*100" metric, but this needs several
    extra fields that view doesn't, and touching a working, already-shipped
    endpoint wasn't worth it just to dedupe. Worth unifying later.
    """
    from apps.configuration.models import GradeScale, SchoolProfile
    from apps.settings_app.models import SystemSetting

    from .models import AFFECTIVE_SKILLS, PSYCHOMOTOR_SKILLS, AttendanceRecord, ReportCardRemark, SkillRating

    scales = list(GradeScale.objects.all())

    def grade_for(pct):
        for scale in scales:
            if scale.min_score <= pct <= scale.max_score:
                return scale.name, scale.remark
        return "", ""

    pass_mark_setting = SystemSetting.objects.filter(key="result.pass_mark").first()
    pass_mark = float(pass_mark_setting.value) if pass_mark_setting and pass_mark_setting.value is not None else 50

    scores = list(ExamScore.objects.filter(exam=exam, student=student).select_related("subject").order_by("subject__name"))
    subject_ids = [s.subject_id for s in scores]

    # Per-subject class stats: every classmate's percentage in each subject,
    # so we can show this student's class avg/max/min/position per row —
    # the legacy card's whole point, and something the in-app Results page
    # never needed since it only shows the student's own numbers.
    per_subject_pcts = {sid: [] for sid in subject_ids}
    if student.class_arm_id and subject_ids:
        peer_rows = ExamScore.objects.filter(
            exam=exam, student__class_arm_id=student.class_arm_id, subject_id__in=subject_ids,
        ).values("student_id", "subject_id", "score", "max_score")
        for row in peer_rows:
            pct = float(row["score"]) / float(row["max_score"]) * 100 if row["max_score"] else 0
            per_subject_pcts[row["subject_id"]].append((row["student_id"], pct))

    def ordinal(n):
        if 10 <= n % 100 <= 20:
            suffix = "th"
        else:
            suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
        return f"{n}{suffix}"

    subject_rows = []
    total_obtainable = Decimal("0")
    total_obtained = Decimal("0")
    passed = failed = 0
    for s in scores:
        pct = round(float(s.score) / float(s.max_score) * 100, 1) if s.max_score else 0
        grade, grade_remark = grade_for(pct)
        peers = per_subject_pcts.get(s.subject_id, [])
        ranked = sorted(peers, key=lambda p: p[1], reverse=True)
        subj_position = next((i + 1 for i, (sid, _) in enumerate(ranked) if sid == student.id), None)
        peer_pcts = [p for _, p in peers]
        total_obtainable += s.max_score
        total_obtained += s.score
        if pct >= pass_mark:
            passed += 1
        else:
            failed += 1
        subject_rows.append({
            "subject": s.subject.name, "ca1_score": s.ca1_score, "ca2_score": s.ca2_score, "exam_score": s.exam_score,
            "total": s.score, "max_score": s.max_score, "percentage": pct,
            "class_avg": round(sum(peer_pcts) / len(peer_pcts), 1) if peer_pcts else None,
            "class_max": round(max(peer_pcts), 1) if peer_pcts else None,
            "class_min": round(min(peer_pcts), 1) if peer_pcts else None,
            "position": ordinal(subj_position) if subj_position else "—",
            "grade": grade or "—",
            "remark": s.remark or grade_remark or "",
        })

    # Whole-class position/size/average — the same metric as ReportCardView,
    # recomputed here rather than imported so this function has no dependency
    # on that view module.
    position, class_size, class_average = None, 0, None
    if student.class_arm_id:
        cls_rows = ExamScore.objects.filter(exam=exam, student__class_arm_id=student.class_arm_id).values(
            "student_id", "score", "max_score",
        )
        by_student = {}
        for row in cls_rows:
            pct = float(row["score"]) / float(row["max_score"]) * 100 if row["max_score"] else 0
            by_student.setdefault(row["student_id"], []).append(pct)
        averages = {sid: sum(v) / len(v) for sid, v in by_student.items()}
        ranked_students = sorted(averages.items(), key=lambda kv: kv[1], reverse=True)
        class_size = len(ranked_students)
        if averages:
            class_average = round(sum(averages.values()) / len(averages), 2)
        for i, (sid, _) in enumerate(ranked_students):
            if sid == student.id:
                position = i + 1
                break

    student_average = round(sum(r["percentage"] for r in subject_rows) / len(subject_rows), 2) if subject_rows else None

    attendance_qs = AttendanceRecord.objects.filter(student=student, term=exam.term)
    attendance_total = attendance_qs.count()
    attendance_present = attendance_qs.filter(status=AttendanceRecord.Status.PRESENT).count()

    remark_row = ReportCardRemark.objects.filter(exam=exam, student=student).first()
    skill_labels = dict(SkillRating.Skill.choices)
    ratings_by_skill = {
        r["skill"]: r["rating"]
        for r in SkillRating.objects.filter(exam=exam, student=student).values("skill", "rating")
    }

    def skill_rows(skill_list):
        # Always all 4 rows, even unrated ones (rating=None -> no column
        # gets an X), so the table's shape matches the printed template
        # regardless of how much of this student's skills block was filled in.
        return [
            {"skill": sk.value, "label": skill_labels.get(sk.value, sk.value), "rating": ratings_by_skill.get(sk.value)}
            for sk in skill_list
        ]

    affective_skills = skill_rows(AFFECTIVE_SKILLS)
    psychomotor_skills = skill_rows(PSYCHOMOTOR_SKILLS)

    age = None
    if student.date_of_birth:
        as_of = exam.term.end_date or date.today()
        age = as_of.year - student.date_of_birth.year - (
            (as_of.month, as_of.day) < (student.date_of_birth.month, student.date_of_birth.day)
        )

    next_term = (
        Term.objects.filter(session_id=exam.term.session_id, start_date__gt=exam.term.start_date)
        .order_by("start_date").first()
        or Term.objects.filter(session__start_date__gt=exam.term.session.start_date).order_by("session__start_date", "start_date").first()
    )

    return {
        "profile": SchoolProfile.objects.first(),
        "student": student,
        "class_arm_label": str(student.class_arm) if student.class_arm else "—",
        "age": age,
        "exam": exam,
        "subject_rows": subject_rows,
        "passed": passed,
        "failed": failed,
        "total_subjects": len(subject_rows),
        "total_obtainable": total_obtainable,
        "total_obtained": total_obtained,
        "class_average": class_average,
        "student_average": student_average,
        "position": ordinal(position) if position else "—",
        "class_size": class_size,
        "class_teacher_remark": remark_row.class_teacher_remark if remark_row else "",
        "principal_remark": remark_row.principal_remark if remark_row else "",
        "affective_skills": affective_skills,
        "psychomotor_skills": psychomotor_skills,
        "attendance_present": attendance_present,
        "attendance_total": attendance_total,
        "term_ended": exam.term.end_date,
        "next_term_begins": next_term.start_date if next_term else None,
        "grading_key": [{"range": f"{sc.min_score}–{sc.max_score}", "letter": sc.name} for sc in scales],
    }
