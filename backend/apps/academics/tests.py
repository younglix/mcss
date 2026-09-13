"""Class-arm performance-based reallocation, plus the results submit ->
approve -> publish workflow: a teacher's submission must actually be
approved (not just submitted, and not stuck rejected) before an exam can be
published to students.

Covers the reallocation spec's required cases: pure re-rank/swap
(capacities unchanged), N_S additive absorption (capacity grows, nobody
displaced), the gap tie-break, first-ever all-N_S banding, and the
compute -> release -> apply gate (nothing touches live records before
release/apply).
"""

from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.configuration.models import AcademicSession, ClassArm, GradeScale, SchoolClass, Term
from apps.rbac.models import Permission, Role, RolePermission, UserRole

from . import services
from .models import (
    AFFECTIVE_SKILLS,
    PSYCHOMOTOR_SKILLS,
    ClassBandingConfig,
    ClassReallocation,
    ClassReallocationMove,
    ClassSubjectAssignment,
    ClassTeacherAssignment,
    Exam,
    ExamScore,
    ResultSubmission,
    SkillRating,
    Student,
    Subject,
)

User = get_user_model()


class ReallocationTestBase(TestCase):
    def setUp(self):
        self.session = AcademicSession.objects.create(
            name="2026/2027", start_date=date(2026, 9, 1), end_date=date(2027, 7, 31), is_current=True,
        )
        self.term1 = Term.objects.create(
            session=self.session, name="First", start_date=date(2026, 9, 1), end_date=date(2026, 12, 15), is_current=True,
        )
        self.term2 = Term.objects.create(
            session=self.session, name="Second", start_date=date(2027, 1, 10), end_date=date(2027, 4, 10),
        )
        self.term3 = Term.objects.create(
            session=self.session, name="Third", start_date=date(2027, 4, 25), end_date=date(2027, 7, 31),
        )
        self.klass = SchoolClass.objects.create(name="JSS 1", level_order=1)
        self.arm_a = ClassArm.objects.create(school_class=self.klass, name="A", capacity=2)
        self.arm_b = ClassArm.objects.create(school_class=self.klass, name="B", capacity=2)
        self.arm_c = ClassArm.objects.create(school_class=self.klass, name="C", capacity=2)
        self.arm_ns = ClassArm.objects.create(school_class=self.klass, name="N_S")
        self.config = ClassBandingConfig.objects.create(
            school_class=self.klass, enabled=True, holding_arm=self.arm_ns,
        )
        self.maths = Subject.objects.create(name="Mathematics", code="MTH")
        self.english = Subject.objects.create(name="English", code="ENG")
        self.exam1 = Exam.objects.create(
            name="First Term Exam", exam_type=Exam.ExamType.FINAL, session=self.session,
            term=self.term1, start_date=date(2026, 12, 1),
        )
        self._student_seq = 0

    def make_student(self, arm, averages=None, name=None):
        """A student in `arm`. `averages` = per-exam {exam: avg} — writes an
        ExamScore per subject so student_term_averages returns that avg."""
        self._student_seq += 1
        user = User.objects.create(
            full_name=name or f"Student {self._student_seq}",
            identifier=f"STU{self._student_seq:03d}", user_type="student",
        )
        student = Student.objects.create(user=user, class_arm=arm, status=Student.Status.ACTIVE)
        for exam, avg in (averages or {}).items():
            for subj in (self.maths, self.english):
                ExamScore.objects.create(
                    exam=exam, student=student, subject=subj, score=Decimal(str(avg)), max_score=Decimal("100"),
                )
        return student

    def arm_of(self, student):
        student.refresh_from_db()
        return student.class_arm_id


class RerankSwapTests(ReallocationTestBase):
    def test_pure_rerank_is_a_swap_with_frozen_capacities(self):
        # Fresh averages: a B student overtakes the lowest A student.
        a1 = self.make_student(self.arm_a, {self.exam1: 85})
        a2 = self.make_student(self.arm_a, {self.exam1: 55})
        b1 = self.make_student(self.arm_b, {self.exam1: 75})
        b2 = self.make_student(self.arm_b, {self.exam1: 65})
        c1 = self.make_student(self.arm_c, {self.exam1: 45})
        c2 = self.make_student(self.arm_c, {self.exam1: 35})

        realloc = services.compute_reallocation(self.klass, self.exam1)
        services.release_reallocation(realloc, actor=None)
        services.apply_reallocation(realloc, actor=None)

        # Ranked 85,75,65,55,45,35 into slots A,A,B,B,C,C
        self.assertEqual(self.arm_of(a1), self.arm_a.id)   # stayed top
        self.assertEqual(self.arm_of(b1), self.arm_a.id)   # rose B -> A
        self.assertEqual(self.arm_of(a2), self.arm_b.id)   # dropped A -> B
        self.assertEqual(self.arm_of(b2), self.arm_b.id)
        self.assertEqual(self.arm_of(c1), self.arm_c.id)
        self.assertEqual(self.arm_of(c2), self.arm_c.id)

        # Head counts identical, capacities untouched.
        for arm, cap in ((self.arm_a, 2), (self.arm_b, 2), (self.arm_c, 2)):
            arm.refresh_from_db()
            self.assertEqual(arm.capacity, cap)
            self.assertEqual(arm.students.filter(status=Student.Status.ACTIVE).count(), 2)

        # No rerank move carries a capacity delta.
        self.assertTrue(all(m.capacity_delta == 0 for m in realloc.moves.all()))
        self.assertTrue(all(m.mechanism == ClassReallocationMove.Mechanism.RERANK for m in realloc.moves.all()))

    def test_student_with_no_score_keeps_their_seat(self):
        a1 = self.make_student(self.arm_a, {self.exam1: 90})
        a2_nograde = self.make_student(self.arm_a)  # sat nothing this term
        b1 = self.make_student(self.arm_b, {self.exam1: 95})  # would out-rank a1
        b2 = self.make_student(self.arm_b, {self.exam1: 50})

        realloc = services.compute_reallocation(self.klass, self.exam1)
        services.release_reallocation(realloc, actor=None)
        services.apply_reallocation(realloc, actor=None)

        # a2 has no average -> stays in A, its slot reserved. Only one A slot
        # is left for the gradeable pool -> b1 (95) takes it, a1 (90) drops.
        self.assertEqual(self.arm_of(a2_nograde), self.arm_a.id)
        self.assertEqual(self.arm_of(b1), self.arm_a.id)
        self.assertEqual(self.arm_of(a1), self.arm_b.id)


class NsAbsorptionTests(ReallocationTestBase):
    def _stable_bands(self):
        # A: 88,82  B: 74,66  C: 58,52  — ranking reproduces the same slots.
        self.make_student(self.arm_a, {self.exam1: 88})
        self.make_student(self.arm_a, {self.exam1: 82})
        self.make_student(self.arm_b, {self.exam1: 74})
        self.make_student(self.arm_b, {self.exam1: 66})
        self.make_student(self.arm_c, {self.exam1: 58})
        self.make_student(self.arm_c, {self.exam1: 52})

    def test_new_student_is_absorbed_additively_capacity_ratchets(self):
        self._stable_bands()
        newbie = self.make_student(self.arm_ns, {self.exam1: 70})  # lands in B's 66-74 range

        realloc = services.compute_reallocation(self.klass, self.exam1)

        ns_moves = realloc.moves.filter(mechanism=ClassReallocationMove.Mechanism.NS_ABSORPTION)
        self.assertEqual(ns_moves.count(), 1)
        move = ns_moves.get()
        self.assertEqual(move.to_arm_id, self.arm_b.id)
        self.assertEqual(move.capacity_delta, 1)

        # No existing A/B/C student moves.
        rerank_moves = realloc.moves.filter(mechanism=ClassReallocationMove.Mechanism.RERANK)
        self.assertTrue(all(m.from_arm_id == m.to_arm_id for m in rerank_moves))

        services.release_reallocation(realloc, actor=None)
        services.apply_reallocation(realloc, actor=None)

        self.arm_b.refresh_from_db()
        self.assertEqual(self.arm_b.capacity, 3)          # 2 -> 3, ratcheted
        self.arm_a.refresh_from_db(); self.arm_c.refresh_from_db()
        self.assertEqual(self.arm_a.capacity, 2)          # untouched
        self.assertEqual(self.arm_c.capacity, 2)
        self.assertEqual(self.arm_of(newbie), self.arm_b.id)
        self.assertEqual(self.arm_b.students.filter(status=Student.Status.ACTIVE).count(), 3)

    def test_absorption_into_an_uncapped_band_seeds_its_capacity(self):
        for arm in (self.arm_a, self.arm_b, self.arm_c):
            arm.capacity = None
            arm.save(update_fields=["capacity"])
        self._stable_bands()
        self.make_student(self.arm_ns, {self.exam1: 70})  # -> B, which has 2 + 1 = 3

        realloc = services.compute_reallocation(self.klass, self.exam1)
        services.release_reallocation(realloc, actor=None)
        services.apply_reallocation(realloc, actor=None)

        self.arm_b.refresh_from_db()
        self.assertEqual(self.arm_b.capacity, 3)   # seeded from post-absorption head count
        self.arm_a.refresh_from_db()
        self.assertIsNone(self.arm_a.capacity)     # untouched band stays uncapped

    def test_new_student_without_a_result_stays_in_holding(self):
        self._stable_bands()
        waiting = self.make_student(self.arm_ns)  # no first result yet

        realloc = services.compute_reallocation(self.klass, self.exam1)
        self.assertFalse(realloc.moves.filter(student=waiting).exists())
        services.release_reallocation(realloc, actor=None)
        services.apply_reallocation(realloc, actor=None)
        self.assertEqual(self.arm_of(waiting), self.arm_ns.id)


class GapTieBreakTests(ReallocationTestBase):
    def test_gap_between_bands_goes_to_higher(self):
        bands = [self.arm_a, self.arm_b, self.arm_c]
        ranges = {
            self.arm_a.id: (Decimal("78"), Decimal("95")),
            self.arm_b.id: (Decimal("62"), Decimal("77")),
            self.arm_c.id: (Decimal("40"), Decimal("61")),
        }
        # 77.5 is in the gap between B's 77 and A's 78 -> higher band, A.
        self.assertEqual(services.place_by_range(Decimal("77.5"), bands, ranges).id, self.arm_a.id)
        # inside a band
        self.assertEqual(services.place_by_range(Decimal("70"), bands, ranges).id, self.arm_b.id)
        # above the top band's ceiling
        self.assertEqual(services.place_by_range(Decimal("99"), bands, ranges).id, self.arm_a.id)
        # below the bottom band's floor
        self.assertEqual(services.place_by_range(Decimal("30"), bands, ranges).id, self.arm_c.id)

    def test_tie_break_constant_is_a_single_switch(self):
        # documents that flipping the one constant flips the behaviour
        self.assertIn(services.GAP_BAND_TIE_BREAK, ("higher", "lower"))


class InitialBandingTests(ReallocationTestBase):
    def test_first_ever_all_ns_banding_respects_capacities(self):
        studs = [self.make_student(self.arm_ns, {self.exam1: avg}) for avg in (95, 85, 75, 65, 55, 45)]

        realloc = services.compute_reallocation(self.klass, self.exam1)
        self.assertTrue(all(m.mechanism == ClassReallocationMove.Mechanism.INITIAL_BANDING for m in realloc.moves.all()))

        services.release_reallocation(realloc, actor=None)
        services.apply_reallocation(realloc, actor=None)

        self.assertEqual([self.arm_of(s) for s in studs], [
            self.arm_a.id, self.arm_a.id, self.arm_b.id, self.arm_b.id, self.arm_c.id, self.arm_c.id,
        ])

    def test_initial_banding_even_split_when_no_capacities(self):
        for arm in (self.arm_a, self.arm_b, self.arm_c):
            arm.capacity = None
            arm.save(update_fields=["capacity"])
        studs = [self.make_student(self.arm_ns, {self.exam1: avg}) for avg in (90, 80, 70, 60, 50)]

        realloc = services.compute_reallocation(self.klass, self.exam1)
        services.release_reallocation(realloc, actor=None)
        services.apply_reallocation(realloc, actor=None)

        # 5 students, 3 bands -> 2, 2, 1 (remainder to the top bands)
        self.assertEqual([self.arm_of(s) for s in studs], [
            self.arm_a.id, self.arm_a.id, self.arm_b.id, self.arm_b.id, self.arm_c.id,
        ])


class LifecycleGateTests(ReallocationTestBase):
    def _populate(self):
        self.students = [
            self.make_student(self.arm_a, {self.exam1: 85}),
            self.make_student(self.arm_a, {self.exam1: 55}),
            self.make_student(self.arm_b, {self.exam1: 75}),
            self.make_student(self.arm_b, {self.exam1: 65}),
        ]

    def test_compute_touches_no_live_records(self):
        self._populate()
        realloc = services.compute_reallocation(self.klass, self.exam1)

        self.assertEqual(realloc.status, ClassReallocation.Status.PENDING)
        for s in self.students:
            s.refresh_from_db()
            self.assertIsNotNone(s.class_arm_id)
            self.assertIsNone(s.next_class_arm_id)   # nothing revealed yet

    def test_release_reveals_but_does_not_move(self):
        self._populate()
        realloc = services.compute_reallocation(self.klass, self.exam1)
        before = {s.id: self.arm_of(s) for s in self.students}

        services.release_reallocation(realloc, actor=None)
        realloc.refresh_from_db()
        self.assertEqual(realloc.status, ClassReallocation.Status.RELEASED)
        self.assertIsNotNone(realloc.released_at)

        for s in self.students:
            s.refresh_from_db()
            self.assertEqual(s.class_arm_id, before[s.id])   # still in the current arm
        # at least one student now has a visible next arm
        self.assertTrue(Student.objects.filter(id__in=[s.id for s in self.students], next_class_arm__isnull=False).exists())

    def test_apply_moves_and_clears_next_arm(self):
        self._populate()
        realloc = services.compute_reallocation(self.klass, self.exam1)
        services.release_reallocation(realloc, actor=None)
        services.apply_reallocation(realloc, actor=None)

        realloc.refresh_from_db()
        self.assertEqual(realloc.status, ClassReallocation.Status.APPLIED)
        for s in self.students:
            s.refresh_from_db()
            self.assertIsNone(s.next_class_arm_id)

    def test_recompute_supersedes_prior_pending(self):
        self._populate()
        first = services.compute_reallocation(self.klass, self.exam1)
        second = services.compute_reallocation(self.klass, self.exam1)

        first.refresh_from_db()
        self.assertEqual(first.status, ClassReallocation.Status.SUPERSEDED)
        self.assertEqual(second.status, ClassReallocation.Status.PENDING)
        live = ClassReallocation.objects.filter(
            school_class=self.klass, term=self.term1,
            status__in=[ClassReallocation.Status.PENDING, ClassReallocation.Status.RELEASED],
        )
        self.assertEqual(live.count(), 1)

    def test_cannot_recompute_over_a_released_proposal(self):
        self._populate()
        realloc = services.compute_reallocation(self.klass, self.exam1)
        services.release_reallocation(realloc, actor=None)
        with self.assertRaises(services.ReallocationError):
            services.compute_reallocation(self.klass, self.exam1)

    def test_release_requires_pending(self):
        self._populate()
        realloc = services.compute_reallocation(self.klass, self.exam1)
        services.release_reallocation(realloc, actor=None)
        with self.assertRaises(services.ReallocationError):
            services.release_reallocation(realloc, actor=None)

    def test_apply_requires_released(self):
        self._populate()
        realloc = services.compute_reallocation(self.klass, self.exam1)
        with self.assertRaises(services.ReallocationError):
            services.apply_reallocation(realloc, actor=None)


class BoundaryTests(ReallocationTestBase):
    def test_third_term_result_does_not_reallocate(self):
        exam3 = Exam.objects.create(
            name="Third Term Exam", exam_type=Exam.ExamType.FINAL, session=self.session,
            term=self.term3, start_date=date(2027, 7, 1),
        )
        self.make_student(self.arm_a, {exam3: 80})
        self.make_student(self.arm_b, {exam3: 60})
        self.assertIsNone(services.compute_reallocation(self.klass, exam3))

    def test_disabled_class_is_untouched(self):
        self.config.enabled = False
        self.config.save(update_fields=["enabled"])
        self.make_student(self.arm_a, {self.exam1: 80})
        self.assertIsNone(services.compute_reallocation(self.klass, self.exam1))

    def test_publish_trigger_fires_only_for_trigger_type_and_early_terms(self):
        self.make_student(self.arm_a, {self.exam1: 85})
        self.make_student(self.arm_b, {self.exam1: 60})

        # a non-final exam publish -> nothing
        test_exam = Exam.objects.create(
            name="First CA", exam_type=Exam.ExamType.TEST, session=self.session,
            term=self.term1, start_date=date(2026, 10, 1),
        )
        services.compute_reallocations_for_published_exam(test_exam)
        self.assertEqual(ClassReallocation.objects.count(), 0)

        # the term's final exam -> one proposal
        made = services.compute_reallocations_for_published_exam(self.exam1)
        self.assertEqual(len(made), 1)
        self.assertEqual(ClassReallocation.objects.filter(status=ClassReallocation.Status.PENDING).count(), 1)


class ApiGateTests(ReallocationTestBase):
    def setUp(self):
        super().setUp()
        # a principal-ish user with the reallocation perms
        role = Role.objects.create(name="Reallocator", slug="reallocator", is_system=False)
        for code in ("reallocation.view", "reallocation.release", "reallocation.apply", "reallocation.configure"):
            perm, _ = Permission.objects.get_or_create(
                code=code, defaults={"module": "reallocation", "action": code.split(".")[1]},
            )
            RolePermission.objects.create(role=role, permission=perm)
        self.admin = User.objects.create(full_name="Admin", email="admin@x.io", user_type="staff")
        UserRole.objects.create(user=self.admin, role=role)

        self.viewer = User.objects.create(full_name="Viewer", email="v@x.io", user_type="staff")
        view_role = Role.objects.create(name="Viewer", slug="realloc-viewer", is_system=False)
        RolePermission.objects.create(role=view_role, permission=Permission.objects.get(code="reallocation.view"))
        UserRole.objects.create(user=self.viewer, role=view_role)

        self.make_student(self.arm_a, {self.exam1: 85})
        self.make_student(self.arm_a, {self.exam1: 55})
        self.make_student(self.arm_b, {self.exam1: 75})
        self.make_student(self.arm_b, {self.exam1: 65})
        self.realloc = services.compute_reallocation(self.klass, self.exam1)

    def test_detail_endpoint_shows_the_full_proposal(self):
        client = APIClient()
        client.force_authenticate(self.viewer)
        res = client.get(f"/api/v1/academics/reallocations/{self.realloc.id}")
        self.assertEqual(res.status_code, 200)
        body = res.json()["data"]
        self.assertEqual(body["status"], "pending")
        self.assertTrue(len(body["moves"]) >= 1)
        self.assertTrue(len(body["arm_summary"]) == 3)
        self.assertIn("proposed_count", body["arm_summary"][0])

    def test_release_needs_the_release_permission(self):
        client = APIClient()
        client.force_authenticate(self.viewer)
        res = client.post(f"/api/v1/academics/reallocations/{self.realloc.id}/release")
        self.assertEqual(res.status_code, 403)

    def test_release_then_apply_via_api(self):
        client = APIClient()
        client.force_authenticate(self.admin)

        r1 = client.post(f"/api/v1/academics/reallocations/{self.realloc.id}/release")
        self.assertEqual(r1.status_code, 200)

        # apply before term start is still allowed manually
        r2 = client.post(f"/api/v1/academics/reallocations/{self.realloc.id}/apply")
        self.assertEqual(r2.status_code, 200)
        self.realloc.refresh_from_db()
        self.assertEqual(self.realloc.status, "applied")

        # applying again -> 400
        r3 = client.post(f"/api/v1/academics/reallocations/{self.realloc.id}/apply")
        self.assertEqual(r3.status_code, 400)

    def test_arm_capacity_edit_is_audited(self):
        from apps.audit.models import AuditLog

        client = APIClient()
        client.force_authenticate(self.admin)
        res = client.put(f"/api/v1/academics/arms/{self.arm_a.id}/capacity", {"capacity": 5}, format="json")
        self.assertEqual(res.status_code, 200)
        self.arm_a.refresh_from_db()
        self.assertEqual(self.arm_a.capacity, 5)
        self.assertTrue(AuditLog.objects.filter(action="academics.arm_capacity_edited", target_id=str(self.arm_a.id)).exists())


class ResultsApprovalGateTestBase(TestCase):
    """A teacher submits one class+subject's scores; a principal must
    actually approve it before the whole exam can be published."""

    def setUp(self):
        self.session = AcademicSession.objects.create(
            name="2026/2027", start_date=date(2026, 9, 1), end_date=date(2027, 7, 31), is_current=True,
        )
        self.term = Term.objects.create(
            session=self.session, name="First", start_date=date(2026, 9, 1), end_date=date(2026, 12, 15), is_current=True,
        )
        self.school_class = SchoolClass.objects.create(name="SS-1", level_order=1)
        self.arm = ClassArm.objects.create(school_class=self.school_class, name="A")
        self.subject = Subject.objects.create(name="Mathematics", code="MTH")
        self.exam = Exam.objects.create(
            name="First CA Test", exam_type=Exam.ExamType.TEST, session=self.session, term=self.term,
            start_date=date(2026, 10, 1),
        )

        self.teacher = User.objects.create(full_name="Teacher One", email="teacher1@x.io", user_type="staff", is_active=True)
        ClassSubjectAssignment.objects.create(class_arm=self.arm, subject=self.subject, teacher=self.teacher, session=self.session)

        student_user = User.objects.create(full_name="Student One", email="student1@x.io", user_type="student", is_active=True)
        self.student = Student.objects.create(user=student_user, class_arm=self.arm, status=Student.Status.ACTIVE)
        ExamScore.objects.create(exam=self.exam, student=self.student, subject=self.subject, score=70, max_score=100, entered_by=self.teacher)

        self.principal_role = Role.objects.create(name="Principal", slug="principal")
        for code in ["results.approve", "results.publish", "results.view"]:
            perm = Permission.objects.create(code=code, module="results", action=code.split(".")[1])
            RolePermission.objects.create(role=self.principal_role, permission=perm)
        self.principal = User.objects.create(full_name="Principal One", email="principal1@x.io", user_type="staff", is_active=True)
        UserRole.objects.create(user=self.principal, role=self.principal_role)

        self.client = APIClient()

    def submit(self):
        self.client.force_authenticate(self.teacher)
        return self.client.post(f"/api/v1/academics/teaching/exams/{self.exam.id}/submit", {
            "subject": str(self.subject.id), "class_arm": str(self.arm.id),
        }, format="json")

    def review(self, submission_id, status):
        self.client.force_authenticate(self.principal)
        return self.client.post(f"/api/v1/academics/result-submissions/{submission_id}/review", {"status": status}, format="json")

    def publish(self):
        self.client.force_authenticate(self.principal)
        return self.client.post(f"/api/v1/academics/exams/{self.exam.id}/publish", {}, format="json")


class PublishRequiresApprovalTests(ResultsApprovalGateTestBase):
    def test_publish_is_blocked_while_a_submission_is_only_submitted_not_approved(self):
        self.submit()
        res = self.publish()
        self.assertEqual(res.status_code, 400)
        self.exam.refresh_from_db()
        self.assertNotEqual(self.exam.status, Exam.Status.PUBLISHED)

    def test_publish_succeeds_once_every_submission_is_approved(self):
        submit_res = self.submit()
        submission_id = submit_res.json()["data"]["id"]
        self.review(submission_id, "approved")

        res = self.publish()
        self.assertEqual(res.status_code, 200, res.json())
        self.exam.refresh_from_db()
        self.assertEqual(self.exam.status, Exam.Status.PUBLISHED)

    def test_publish_is_blocked_while_a_submission_is_rejected(self):
        submit_res = self.submit()
        submission_id = submit_res.json()["data"]["id"]
        self.review(submission_id, "rejected")
        submission = ResultSubmission.objects.get(id=submission_id)
        self.assertEqual(submission.status, "rejected")

        res = self.publish()
        self.assertEqual(res.status_code, 400)

    def test_publish_with_no_submissions_at_all_is_unaffected(self):
        """A class+subject whose scores were entered directly by staff,
        never routed through the submit-for-approval flow, shouldn't block
        publish — only an existing, unresolved submission does."""
        res = self.publish()
        self.assertEqual(res.status_code, 200, res.json())

    def test_a_published_exams_results_are_now_visible_to_the_student(self):
        submit_res = self.submit()
        self.review(submit_res.json()["data"]["id"], "approved")
        self.publish()

        self.client.force_authenticate(self.student.user)
        res = self.client.get(f"/api/v1/academics/exams/{self.exam.id}/report-card/{self.student.id}")
        self.assertEqual(res.status_code, 200)


class ResubmitAfterRejectionTests(ResultsApprovalGateTestBase):
    def test_rejected_submission_can_be_resubmitted_not_permanently_stuck(self):
        submit_res = self.submit()
        submission_id = submit_res.json()["data"]["id"]
        self.review(submission_id, "rejected")

        res = self.submit()  # teacher fixes the scores and resubmits
        self.assertEqual(res.status_code, 200, res.json())
        self.assertEqual(res.json()["data"]["id"], submission_id)  # same row, not a new one — unique_together
        self.assertEqual(res.json()["data"]["status"], "submitted")

        submission = ResultSubmission.objects.get(id=submission_id)
        self.assertIsNone(submission.reviewed_by_id)
        self.assertIsNone(submission.reviewed_at)
        self.assertEqual(submission.review_note, "")

    def test_resubmitting_an_already_pending_submission_still_conflicts(self):
        self.submit()
        res = self.submit()
        self.assertEqual(res.status_code, 409)

    def test_resubmitting_an_approved_submission_still_conflicts(self):
        submit_res = self.submit()
        self.review(submit_res.json()["data"]["id"], "approved")
        res = self.submit()
        self.assertEqual(res.status_code, 409)


class ReportCardPDFTests(ResultsApprovalGateTestBase):
    """The PDF download crashed in production with a ReportLab data error —
    root-caused to zero GradeScale rows existing there, which made the
    grading-key table's second <tr> render as a literally empty row while
    its first cell still carried rowspan="2" from row one. Reproduced
    exactly here by leaving GradeScale empty (the setUp default) instead of
    guessing at the traceback."""

    def _publish(self):
        submit_res = self.submit()
        self.review(submit_res.json()["data"]["id"], "approved")
        self.publish()

    def test_pdf_downloads_with_no_grade_scales_configured(self):
        self._publish()
        self.client.force_authenticate(self.student.user)
        res = self.client.get(f"/api/v1/academics/exams/{self.exam.id}/report-card/{self.student.id}/pdf")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res["Content-Type"], "application/pdf")

    def test_pdf_downloads_with_grade_scales_configured(self):
        GradeScale.objects.create(name="A", min_score=70, max_score=100, remark="Excellent")
        GradeScale.objects.create(name="F", min_score=0, max_score=69, remark="Fail")
        self._publish()
        self.client.force_authenticate(self.student.user)
        res = self.client.get(f"/api/v1/academics/exams/{self.exam.id}/report-card/{self.student.id}/pdf")
        self.assertEqual(res.status_code, 200)


class MarksheetCompilationTests(TestCase):
    """Exam Officer > Marksheet used to be a static mock page (hardcoded
    students/subjects/stats, dead Export/Print buttons) — this covers the
    real backend grid it now fetches: every student in a class-arm × every
    subject assigned to that class this session, missing cells flagged."""

    def setUp(self):
        self.session = AcademicSession.objects.create(
            name="2026/2027", start_date=date(2026, 9, 1), end_date=date(2027, 7, 31), is_current=True,
        )
        self.term = Term.objects.create(
            session=self.session, name="First", start_date=date(2026, 9, 1), end_date=date(2026, 12, 15), is_current=True,
        )
        self.school_class = SchoolClass.objects.create(name="SS-3", level_order=3)
        self.arm = ClassArm.objects.create(school_class=self.school_class, name="A")
        self.math = Subject.objects.create(name="Mathematics", code="MTH")
        self.eng = Subject.objects.create(name="English", code="ENG")
        self.exam = Exam.objects.create(
            name="Compilation Test Exam", exam_type=Exam.ExamType.TEST, session=self.session, term=self.term,
            start_date=date(2026, 10, 1),
        )
        teacher = User.objects.create(full_name="Teacher One", email="mcteacher1@x.io", user_type="staff", is_active=True)
        ClassSubjectAssignment.objects.create(class_arm=self.arm, subject=self.math, teacher=teacher, session=self.session)
        ClassSubjectAssignment.objects.create(class_arm=self.arm, subject=self.eng, teacher=teacher, session=self.session)

        u1 = User.objects.create(full_name="Alpha Student", email="mcalpha@x.io", user_type="student", is_active=True)
        u2 = User.objects.create(full_name="Beta Student", email="mcbeta@x.io", user_type="student", is_active=True)
        self.s1 = Student.objects.create(user=u1, class_arm=self.arm, status=Student.Status.ACTIVE)
        self.s2 = Student.objects.create(user=u2, class_arm=self.arm, status=Student.Status.ACTIVE)

        ExamScore.objects.create(exam=self.exam, student=self.s1, subject=self.math, score=80, max_score=100, entered_by=teacher)
        ExamScore.objects.create(exam=self.exam, student=self.s1, subject=self.eng, score=60, max_score=100, entered_by=teacher)
        ExamScore.objects.create(exam=self.exam, student=self.s2, subject=self.math, score=90, max_score=100, entered_by=teacher)
        # s2's English score is deliberately left missing.

        self.officer_role = Role.objects.create(name="Exam Officer", slug="exam_officer_mc")
        perm = Permission.objects.create(code="results.view", module="results", action="view")
        RolePermission.objects.create(role=self.officer_role, permission=perm)
        self.officer = User.objects.create(full_name="Officer One", email="mcofficer@x.io", user_type="staff", is_active=True)
        UserRole.objects.create(user=self.officer, role=self.officer_role)

        self.outsider = User.objects.create(full_name="No Perms", email="mcoutsider@x.io", user_type="staff", is_active=True)

        self.client = APIClient()

    def get(self, class_arm=None):
        self.client.force_authenticate(self.officer)
        url = f"/api/v1/academics/exams/{self.exam.id}/marksheet-compilation"
        if class_arm is not None:
            url += f"?class_arm={class_arm}"
        return self.client.get(url)

    def test_class_arm_is_required(self):
        res = self.get()
        self.assertEqual(res.status_code, 400)

    def test_someone_without_results_view_is_forbidden(self):
        self.client.force_authenticate(self.outsider)
        res = self.client.get(f"/api/v1/academics/exams/{self.exam.id}/marksheet-compilation?class_arm={self.arm.id}")
        self.assertEqual(res.status_code, 403)

    def test_returns_the_real_subject_and_student_grid(self):
        res = self.get(self.arm.id)
        self.assertEqual(res.status_code, 200, res.json())
        data = res.json()["data"]

        subject_names = {s["name"] for s in data["subjects"]}
        self.assertEqual(subject_names, {"Mathematics", "English"})

        rows = {row["name"]: row for row in data["students"]}
        self.assertEqual(set(rows), {"Alpha Student", "Beta Student"})

        alpha_scores = {c["subject"]: c["percentage"] for c in rows["Alpha Student"]["scores"] if c}
        self.assertEqual(len(alpha_scores), 2)
        self.assertEqual(rows["Alpha Student"]["average"], 70.0)  # (80+60)/2

        beta_cells = rows["Beta Student"]["scores"]
        self.assertTrue(any(c is None for c in beta_cells), "Beta's missing English score should be null, not fabricated")
        self.assertIsNone(rows["Beta Student"]["average"], "average should be None while a subject is still missing")

    def test_stats_reflect_real_completeness(self):
        res = self.get(self.arm.id)
        stats = res.json()["data"]["stats"]
        self.assertEqual(stats["total_students"], 2)
        self.assertEqual(stats["missing_scores"], 1)  # 2 students x 2 subjects = 4 expected, 3 entered
        self.assertEqual(stats["data_completeness"], 75.0)
        self.assertEqual(stats["class_average"], 76.7)  # mean of 80, 60, 90


class Ca1Ca2SplitTests(ResultsApprovalGateTestBase):
    """The report card's official template needs two continuous-assessment
    columns, not one — ExamScore.ca_score was renamed to ca1_score and a new
    optional ca2_score was added (migration 0006). Covers both entry
    endpoints (the generic staff one and the teacher-portal one) and that a
    subject with only ca1+exam (no ca2) still works, matching a school that
    only ran one CA that term."""

    def enter_via_teaching_endpoint(self, ca1, ca2, exam_score):
        self.client.force_authenticate(self.teacher)
        entry = {"student": str(self.student.id), "ca1_score": ca1, "exam_score": exam_score}
        if ca2 is not None:
            entry["ca2_score"] = ca2
        return self.client.post(f"/api/v1/academics/teaching/exams/{self.exam.id}/scores", {
            "subject": str(self.subject.id), "class_arm": str(self.arm.id), "max_score": 100,
            "scores": [entry],
        }, format="json")

    def test_ca1_ca2_and_exam_sum_to_the_total(self):
        res = self.enter_via_teaching_endpoint(14, 19, 57)
        self.assertEqual(res.status_code, 200, res.json())
        score = ExamScore.objects.get(exam=self.exam, student=self.student, subject=self.subject)
        self.assertEqual(score.ca1_score, 14)
        self.assertEqual(score.ca2_score, 19)
        self.assertEqual(score.exam_score, 57)
        self.assertEqual(score.score, 90)

    def test_ca2_is_optional_ca1_plus_exam_still_works(self):
        res = self.enter_via_teaching_endpoint(30, None, 60)
        self.assertEqual(res.status_code, 200, res.json())
        score = ExamScore.objects.get(exam=self.exam, student=self.student, subject=self.subject)
        self.assertIsNone(score.ca2_score)
        self.assertEqual(score.score, 90)

    def test_plain_score_without_any_ca_split_still_works(self):
        enter_perm = Permission.objects.create(code="results.enter", module="results", action="enter")
        RolePermission.objects.create(role=self.principal_role, permission=enter_perm)
        self.client.force_authenticate(self.principal)
        res = self.client.post(f"/api/v1/academics/exams/{self.exam.id}/scores", {
            "subject": str(self.subject.id), "max_score": 100,
            "scores": [{"student": str(self.student.id), "score": 88}],
        }, format="json")
        self.assertEqual(res.status_code, 200, res.json())
        score = ExamScore.objects.get(exam=self.exam, student=self.student, subject=self.subject)
        self.assertIsNone(score.ca1_score)
        self.assertEqual(score.score, 88)


class SkillCategoriesTests(ResultsApprovalGateTestBase):
    """The report card's official template splits skills into two separate
    Affective/Psychomotor tables of 4 each, replacing the old flat 4-skill
    list (Leadership dropped)."""

    def test_affective_and_psychomotor_lists_have_four_each_and_dont_overlap(self):
        self.assertEqual(len(AFFECTIVE_SKILLS), 4)
        self.assertEqual(len(PSYCHOMOTOR_SKILLS), 4)
        self.assertEqual(set(AFFECTIVE_SKILLS) & set(PSYCHOMOTOR_SKILLS), set())

    def test_build_printable_report_card_splits_ratings_into_both_tables(self):
        SkillRating.objects.create(exam=self.exam, student=self.student, skill="honesty", rating=5)
        SkillRating.objects.create(exam=self.exam, student=self.student, skill="music", rating=4)

        ctx = services.build_printable_report_card(self.exam, self.student)

        self.assertEqual(len(ctx["affective_skills"]), 4)
        self.assertEqual(len(ctx["psychomotor_skills"]), 4)
        honesty = next(s for s in ctx["affective_skills"] if s["skill"] == "honesty")
        self.assertEqual(honesty["rating"], 5)
        music = next(s for s in ctx["psychomotor_skills"] if s["skill"] == "music")
        self.assertEqual(music["rating"], 4)
        # A skill nobody rated yet still shows up as a row (rating=None), not
        # silently dropped — the printed table always has all 4 rows.
        neatness = next(s for s in ctx["affective_skills"] if s["skill"] == "neatness")
        self.assertIsNone(neatness["rating"])

    def test_reportcardview_json_api_reflects_the_ca_split(self):
        ExamScore.objects.filter(exam=self.exam, student=self.student, subject=self.subject).update(
            ca1_score=14, ca2_score=19, exam_score=57, score=90,
        )
        self.client.force_authenticate(self.student.user)
        res = self.client.get(f"/api/v1/academics/exams/{self.exam.id}/report-card/{self.student.id}")
        # Staff/self preview is allowed pre-publish for the owner in this
        # base fixture's exam (status defaults to scheduled) only for staff;
        # publish first so the student can view it.
        if res.status_code == 403:
            self.exam.status = Exam.Status.PUBLISHED
            self.exam.save(update_fields=["status"])
            res = self.client.get(f"/api/v1/academics/exams/{self.exam.id}/report-card/{self.student.id}")
        self.assertEqual(res.status_code, 200, res.json())
        row = res.json()["data"]["subjects"][0]
        self.assertEqual(float(row["ca1_score"]), 14)
        self.assertEqual(float(row["ca2_score"]), 19)
