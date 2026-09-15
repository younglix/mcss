from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.rbac.models import Permission, Role, RolePermission, UserRole
from apps.settings_app.models import SystemSetting

from . import services
from .auth import issue_exam_session_token
from .models import Exam, QuestionBank

User = get_user_model()


class ExamSettingsViewTests(TestCase):
    """The min-bank-size exam.* setting used to have no UI anywhere — Super
    Admin/Exam Officer could only change it via the Django admin. Covers its
    own narrowly-scoped endpoint (exam.config_edit, not the blanket
    settings.edit an Exam Officer doesn't hold)."""

    def setUp(self):
        self.role = Role.objects.create(name="Exam Officer", slug="exam_officer")
        for code in ["exam.view", "exam.config_edit"]:
            perm = Permission.objects.create(code=code, module="exam", action=code.split(".")[1])
            RolePermission.objects.create(role=self.role, permission=perm)
        self.officer = User.objects.create(full_name="Officer One", email="officer1@x.io", user_type="staff", is_active=True)
        UserRole.objects.create(user=self.officer, role=self.role)

        self.outsider = User.objects.create(full_name="Teacher One", email="teacher1@x.io", user_type="staff", is_active=True)

        self.client = APIClient()

    def test_get_returns_the_default_when_unconfigured(self):
        self.client.force_authenticate(self.officer)
        res = self.client.get("/api/v1/exam/settings")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["data"]["min_bank_size"], 150)

    def test_exam_officer_can_update_it(self):
        self.client.force_authenticate(self.officer)
        res = self.client.post("/api/v1/exam/settings", {"min_bank_size": 80}, format="json")
        self.assertEqual(res.status_code, 200, res.json())
        self.assertEqual(res.json()["data"]["min_bank_size"], 80)
        self.assertEqual(services.get_min_bank_size(), 80)

        setting = SystemSetting.objects.get(key="exam.min_bank_size")
        self.assertEqual(setting.group, "exam")
        self.assertEqual(setting.value, 80)

    def test_a_staff_member_without_exam_config_edit_is_forbidden(self):
        self.client.force_authenticate(self.outsider)
        res = self.client.post("/api/v1/exam/settings", {"min_bank_size": 80}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_rejects_a_non_numeric_value(self):
        self.client.force_authenticate(self.officer)
        res = self.client.post("/api/v1/exam/settings", {"min_bank_size": "not-a-number"}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_rejects_a_value_below_one(self):
        self.client.force_authenticate(self.officer)
        res = self.client.post("/api/v1/exam/settings", {"min_bank_size": 0}, format="json")
        self.assertEqual(res.status_code, 400)


class ActiveStudentRestrictionTests(TestCase):
    """The ACTIVE_STUDENT restriction_type: a student with an unpaid Tuition
    Fee (or any category tagged active_student) can't start a CBE attempt —
    "active student" in the fee-restriction sense, not academics.Student.status."""

    def setUp(self):
        from apps.academics.models import Student
        from apps.academics.models import Exam as AcademicExam
        from apps.academics.models import Subject as AcademicSubject
        from apps.configuration.models import AcademicSession, ClassArm, FeeCategory, SchoolClass, Term

        self.session = AcademicSession.objects.create(
            name="2026/2027", start_date=date(2026, 9, 1), end_date=date(2027, 7, 31), is_current=True,
        )
        self.term = Term.objects.create(session=self.session, name="First", start_date=date(2026, 9, 1), end_date=date(2026, 12, 15))
        school_class = SchoolClass.objects.create(name="SS-1", level_order=1)
        arm = ClassArm.objects.create(school_class=school_class, name="A")
        subject = AcademicSubject.objects.create(name="Mathematics", code="MTH")
        academic_exam = AcademicExam.objects.create(
            name="First Term Exam", exam_type=AcademicExam.ExamType.TEST, session=self.session,
            term=self.term, start_date=date(2026, 10, 1),
        )
        bank = QuestionBank.objects.create(subject=subject, school_class=school_class, term=self.term, is_approved=True)
        self.exam = Exam.objects.create(
            title="CBE Sitting", academic_exam=academic_exam, subject=subject, school_class=school_class,
            class_arm=arm, bank=bank, status=Exam.Status.ACTIVE,
        )

        student_user = User.objects.create(full_name="Student One", identifier="STU001", user_type="student", is_active=True)
        self.student = Student.objects.create(user=student_user, class_arm=arm, status=Student.Status.ACTIVE)
        self.tuition = FeeCategory.objects.create(
            name="Tuition Fee", is_recurring=True, restriction_type=FeeCategory.RestrictionType.ACTIVE_STUDENT,
        )

        self.client = APIClient()
        token = issue_exam_session_token(student_user, self.exam)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def _start(self):
        return self.client.post(f"/api/v1/exam/exams/{self.exam.id}/attempts/start")

    def test_blocked_while_tuition_is_unpaid(self):
        from apps.finance.models import Invoice

        Invoice.objects.create(
            student=self.student, session=self.session, category=self.tuition,
            description="Tuition Fee", amount=Decimal("100000"),
        )
        res = self._start()
        self.assertEqual(res.status_code, 403)
        self.assertIn("Tuition Fee", res.json()["message"])

    def test_allowed_once_tuition_is_paid(self):
        from apps.finance.models import Invoice, Payment

        invoice = Invoice.objects.create(
            student=self.student, session=self.session, category=self.tuition,
            description="Tuition Fee", amount=Decimal("100000"),
        )
        Payment.objects.create(invoice=invoice, amount=invoice.amount)
        invoice.refresh_status()
        res = self._start()
        self.assertEqual(res.status_code, 200, res.json())

    def test_allowed_with_no_outstanding_invoices(self):
        res = self._start()
        self.assertEqual(res.status_code, 200, res.json())
