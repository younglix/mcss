"""Fee-item restriction gates: a student with an outstanding invoice against
a FeeCategory tagged for library/hostel/transport/activity must be blocked
from that specific service until it's paid, waived, or the category simply
isn't restriction-tagged at all — see apps.finance.services.restriction_check,
covered in isolation in apps.finance.tests. This file proves each of the four
staff-facing creation endpoints actually calls it.
"""

from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.academics.models import Student
from apps.configuration.models import AcademicSession, FeeCategory
from apps.finance.models import Invoice, Payment
from apps.rbac.models import Permission, Role, RolePermission, UserRole

from .models import Activity, Book, HostelBlock, HostelRoom, TransportRoute

User = get_user_model()


class RestrictionGateTestBase(TestCase):
    def setUp(self):
        self.session = AcademicSession.objects.create(
            name="2026/2027", start_date=date(2026, 9, 1), end_date=date(2027, 7, 31), is_current=True,
        )
        student_user = User.objects.create(full_name="Student One", email="stu1@x.io", user_type="student", is_active=True)
        self.student = Student.objects.create(user=student_user)

        self.staff = User.objects.create(full_name="Staff One", email="staff1@x.io", user_type="staff", is_active=True)
        self.client = APIClient()

    def grant(self, user, *codes):
        role = Role.objects.create(name=f"Role-{user.id}", slug=f"role-{user.id}")
        for code in codes:
            perm, _ = Permission.objects.get_or_create(code=code, defaults={"module": code.split(".")[0], "action": code.split(".")[1]})
            RolePermission.objects.create(role=role, permission=perm)
        UserRole.objects.create(user=user, role=role)

    def unpaid_invoice(self, restriction_type, name="Test Fee"):
        category = FeeCategory.objects.create(name=name, is_recurring=True, restriction_type=restriction_type)
        return Invoice.objects.create(
            student=self.student, session=self.session, category=category, description=name, amount=Decimal("3000"),
        )


class LibraryRestrictionTests(RestrictionGateTestBase):
    def setUp(self):
        super().setUp()
        self.grant(self.staff, "library.view", "library.create")
        self.book = Book.objects.create(title="Test Book", total_copies=2, available_copies=2)

    def _checkout(self):
        self.client.force_authenticate(self.staff)
        return self.client.post("/api/v1/student-services/library/loans", {
            "book": str(self.book.id), "borrower": str(self.student.user_id),
            "due_date": (date.today() + timedelta(days=14)).isoformat(),
        }, format="json")

    def test_blocked_while_a_library_fee_is_unpaid(self):
        self.unpaid_invoice(FeeCategory.RestrictionType.LIBRARY, "Library Fee")
        res = self._checkout()
        self.assertEqual(res.status_code, 400)
        self.assertIn("Library Fee", str(res.json()))
        self.book.refresh_from_db()
        self.assertEqual(self.book.available_copies, 2)  # nothing checked out

    def test_allowed_once_paid(self):
        invoice = self.unpaid_invoice(FeeCategory.RestrictionType.LIBRARY, "Library Fee")
        Payment.objects.create(invoice=invoice, amount=invoice.amount)
        invoice.refresh_status()
        res = self._checkout()
        self.assertEqual(res.status_code, 201, res.json())

    def test_allowed_with_no_outstanding_invoices_at_all(self):
        res = self._checkout()
        self.assertEqual(res.status_code, 201, res.json())

    def test_an_unrelated_restriction_type_does_not_block_library(self):
        self.unpaid_invoice(FeeCategory.RestrictionType.HOSTEL, "Hostel Accommodation Fee")
        res = self._checkout()
        self.assertEqual(res.status_code, 201, res.json())


class HostelRestrictionTests(RestrictionGateTestBase):
    def setUp(self):
        super().setUp()
        self.grant(self.staff, "hostel.view", "hostel.allocate")
        block = HostelBlock.objects.create(name="Block A")
        self.room = HostelRoom.objects.create(block=block, room_number="101", capacity=4)

    def _allocate(self):
        self.client.force_authenticate(self.staff)
        return self.client.post("/api/v1/student-services/hostel/allocations", {
            "student": str(self.student.id), "room": str(self.room.id),
        }, format="json")

    def test_blocked_while_hostel_fee_is_unpaid(self):
        self.unpaid_invoice(FeeCategory.RestrictionType.HOSTEL, "Hostel Accommodation Fee")
        res = self._allocate()
        self.assertEqual(res.status_code, 400)
        self.assertIn("Hostel Accommodation Fee", str(res.json()))

    def test_allowed_once_paid(self):
        invoice = self.unpaid_invoice(FeeCategory.RestrictionType.HOSTEL, "Hostel Accommodation Fee")
        Payment.objects.create(invoice=invoice, amount=invoice.amount)
        invoice.refresh_status()
        res = self._allocate()
        self.assertEqual(res.status_code, 201, res.json())


class TransportRestrictionTests(RestrictionGateTestBase):
    def setUp(self):
        super().setUp()
        self.grant(self.staff, "transport.view", "transport.assign")
        self.route = TransportRoute.objects.create(name="Route 1")

    def _assign(self):
        self.client.force_authenticate(self.staff)
        return self.client.post("/api/v1/student-services/transport/assignments", {
            "student": str(self.student.id), "route": str(self.route.id),
        }, format="json")

    def test_blocked_while_transport_fee_is_unpaid(self):
        self.unpaid_invoice(FeeCategory.RestrictionType.TRANSPORT, "School Bus/Transport Fee")
        res = self._assign()
        self.assertEqual(res.status_code, 400)
        self.assertIn("School Bus/Transport Fee", str(res.json()))

    def test_allowed_once_paid(self):
        invoice = self.unpaid_invoice(FeeCategory.RestrictionType.TRANSPORT, "School Bus/Transport Fee")
        Payment.objects.create(invoice=invoice, amount=invoice.amount)
        invoice.refresh_status()
        res = self._assign()
        self.assertEqual(res.status_code, 201, res.json())


class ActivityRestrictionTests(RestrictionGateTestBase):
    def setUp(self):
        super().setUp()
        self.grant(self.staff, "activities.view", "activities.enroll")
        self.activity = Activity.objects.create(name="Debate Club", category=Activity.Category.CLUB)

    def _enroll(self):
        self.client.force_authenticate(self.staff)
        return self.client.post(f"/api/v1/student-services/activities/{self.activity.id}/participants", {
            "student": str(self.student.id),
        }, format="json")

    def test_blocked_while_an_activity_fee_is_unpaid(self):
        self.unpaid_invoice(FeeCategory.RestrictionType.ACTIVITY, "Sports Fee")
        res = self._enroll()
        self.assertEqual(res.status_code, 400)
        self.assertIn("Sports Fee", str(res.json()))

    def test_allowed_once_paid(self):
        invoice = self.unpaid_invoice(FeeCategory.RestrictionType.ACTIVITY, "Sports Fee")
        Payment.objects.create(invoice=invoice, amount=invoice.amount)
        invoice.refresh_status()
        res = self._enroll()
        self.assertEqual(res.status_code, 201, res.json())
