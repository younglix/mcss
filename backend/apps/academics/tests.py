"""Class-arm performance-based reallocation.

Covers the spec's required cases: pure re-rank/swap (capacities unchanged),
N_S additive absorption (capacity grows, nobody displaced), the gap
tie-break, first-ever all-N_S banding, and the compute -> release -> apply
gate (nothing touches live records before release/apply).
"""

from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.configuration.models import AcademicSession, ClassArm, SchoolClass, Term
from apps.rbac.models import Permission, Role, RolePermission, UserRole

from . import services
from .models import (
    ClassBandingConfig,
    ClassReallocation,
    ClassReallocationMove,
    Exam,
    ExamScore,
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
