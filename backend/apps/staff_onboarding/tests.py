"""Self-service "create my staff account" onboarding: public submit,
HR/Super Admin review queue, and approval provisioning (real User + role +
class/subject assignments for academic staff, or a plain
NonAcademicStaffPayout row for non-academic staff — never both)."""

from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.academics.models import ClassSubjectAssignment, ClassTeacherAssignment, Subject
from apps.configuration.models import AcademicSession, ClassArm, SchoolClass
from apps.custom_fields.models import CustomField, CustomFieldValue
from apps.custom_fields.views import MASKED_VALUE
from apps.finance.models import NonAcademicStaffPayout
from apps.rbac.models import Permission, Role, RolePermission, UserRole

from . import services
from .models import StaffApplication, StaffApplicationSubjectClaim

User = get_user_model()


class StaffOnboardingTestBase(TestCase):
    def setUp(self):
        self.session = AcademicSession.objects.create(
            name="2026/2027", start_date=date(2026, 9, 1), end_date=date(2027, 7, 31), is_current=True,
        )
        self.ss1 = SchoolClass.objects.create(name="SS-1", level_order=1)
        self.ss1a = ClassArm.objects.create(school_class=self.ss1, name="A")
        self.ss1b = ClassArm.objects.create(school_class=self.ss1, name="B")
        self.maths = Subject.objects.create(name="Mathematics", code="MTH")
        self.physics = Subject.objects.create(name="Physics", code="PHY")

        CustomField.objects.create(entity="staff", key="nin", label="NIN", field_type="text", is_sensitive=True)
        CustomField.objects.create(entity="staff", key="qualification", label="Qualification", field_type="text")

        self.teacher_role = Role.objects.create(name="Teacher", slug="teacher")
        self.hr_role = Role.objects.create(name="HR", slug="hr")
        review_perm = Permission.objects.create(code="staff_applications.review", module="staff_applications", action="review")
        view_perm = Permission.objects.create(code="staff_applications.view", module="staff_applications", action="view")
        custom_fields_view_perm = Permission.objects.create(code="custom_fields.view", module="custom_fields", action="view")
        RolePermission.objects.create(role=self.hr_role, permission=review_perm)
        RolePermission.objects.create(role=self.hr_role, permission=view_perm)
        RolePermission.objects.create(role=self.hr_role, permission=custom_fields_view_perm)

        self.hr_user = User.objects.create(full_name="HR One", email="hr@x.io", user_type="staff", is_active=True)
        UserRole.objects.create(user=self.hr_user, role=self.hr_role)
        self.superadmin = User.objects.create(
            full_name="Super Admin", email="sa@x.io", user_type="staff", is_active=True, is_superadmin=True,
        )
        self.client = APIClient()

    def submit_teacher_application(self, **overrides):
        fields = {
            "staff_type": StaffApplication.StaffType.TEACHER,
            "full_name": "Jane Teacher", "email": "jane@x.io", "phone": "08011112222",
            "nin": "12345678901", "qualification": "B.Sc Mathematics",
        }
        fields.update(overrides)
        return StaffApplication.objects.create(**fields)


class PublicConfigAndSubmitTests(StaffOnboardingTestBase):
    def test_config_endpoint_is_public_and_lists_real_data(self):
        res = self.client.get("/api/v1/staff-applications/config")
        body = res.json()["data"]
        self.assertEqual(res.status_code, 200)
        self.assertIn({"value": "teacher", "label": "Teacher"}, body["staff_types"])
        self.assertIn({"value": "non_academic", "label": "Non-Academic Staff"}, body["staff_types"])
        self.assertTrue(any(s["name"] == "Mathematics" for s in body["subjects"]))
        self.assertTrue(any(a["name"] == "SS-1 A" for a in body["class_arms"]))

    def test_teacher_submission_requires_nin_and_subject_claims(self):
        res = self.client.post("/api/v1/staff-applications/submit", {
            "staff_type": "teacher", "full_name": "No NIN Guy", "email": "nonin@x.io",
        }, format="json")
        self.assertEqual(res.status_code, 400)
        errors = res.json()["errors"]
        self.assertIn("nin", errors)

    def test_non_academic_submission_only_needs_name_and_role_title(self):
        res = self.client.post("/api/v1/staff-applications/submit", {
            "staff_type": "non_academic", "full_name": "Cleaner Person", "phone": "08033334444",
            "non_academic_role_title": "Cleaner",
        }, format="json")
        self.assertEqual(res.status_code, 201)
        application = StaffApplication.objects.get(id=res.json()["data"]["id"])
        self.assertEqual(application.status, StaffApplication.Status.SUBMITTED)

    def test_teacher_submission_with_claims_succeeds(self):
        res = self.client.post("/api/v1/staff-applications/submit", {
            "staff_type": "teacher", "full_name": "Jane Teacher", "email": "jane2@x.io",
            "nin": "12345678901", "qualification": "B.Sc Mathematics",
            "is_form_teacher": True, "form_teacher_class_arm": str(self.ss1a.id),
            "subject_claims": [
                {"subject": str(self.maths.id), "class_arm": str(self.ss1a.id)},
                {"subject": str(self.maths.id), "class_arm": str(self.ss1b.id)},
            ],
        }, format="json")
        self.assertEqual(res.status_code, 201, res.json())
        application = StaffApplication.objects.get(id=res.json()["data"]["id"])
        self.assertEqual(application.subject_claims.count(), 2)

    def test_no_email_or_phone_is_rejected(self):
        res = self.client.post("/api/v1/staff-applications/submit", {
            "staff_type": "non_academic", "full_name": "No Contact", "non_academic_role_title": "Driver",
        }, format="json")
        self.assertEqual(res.status_code, 400)


class ReviewQueuePermissionTests(StaffOnboardingTestBase):
    def test_anonymous_cannot_list_applications(self):
        res = self.client.get("/api/v1/staff-applications/")
        self.assertEqual(res.status_code, 401)

    def test_hr_can_list_applications(self):
        self.submit_teacher_application()
        self.client.force_authenticate(self.hr_user)
        res = self.client.get("/api/v1/staff-applications/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()["data"]), 1)

    def test_user_without_permission_cannot_approve(self):
        plain_staff = User.objects.create(full_name="Plain Staff", email="plain@x.io", user_type="staff", is_active=True)
        application = self.submit_teacher_application()
        self.client.force_authenticate(plain_staff)
        res = self.client.post(f"/api/v1/staff-applications/{application.id}/approve", {}, format="json")
        self.assertEqual(res.status_code, 403)


class TeacherApprovalTests(StaffOnboardingTestBase):
    def _make_and_approve(self, is_form_teacher=True):
        application = self.submit_teacher_application(
            is_form_teacher=is_form_teacher, form_teacher_class_arm=self.ss1a if is_form_teacher else None,
        )
        StaffApplicationSubjectClaim.objects.create(application=application, subject=self.maths, class_arm=self.ss1a)
        StaffApplicationSubjectClaim.objects.create(application=application, subject=self.physics, class_arm=self.ss1b)
        services.approve_staff_application(application, self.hr_user)
        application.refresh_from_db()
        return application

    def test_approval_creates_a_real_user_with_the_teacher_role(self):
        application = self._make_and_approve()
        self.assertIsNotNone(application.created_user_id)
        user = application.created_user
        self.assertEqual(user.user_type, "staff")
        self.assertTrue(user.identifier)  # generate_number("staff") produced something
        self.assertTrue(UserRole.objects.filter(user=user, role=self.teacher_role).exists())

    def test_approval_creates_class_subject_assignments_for_every_claim(self):
        application = self._make_and_approve()
        user = application.created_user
        self.assertTrue(ClassSubjectAssignment.objects.filter(
            class_arm=self.ss1a, subject=self.maths, teacher=user, session=self.session,
        ).exists())
        self.assertTrue(ClassSubjectAssignment.objects.filter(
            class_arm=self.ss1b, subject=self.physics, teacher=user, session=self.session,
        ).exists())

    def test_approval_creates_the_form_teacher_assignment(self):
        application = self._make_and_approve(is_form_teacher=True)
        self.assertTrue(ClassTeacherAssignment.objects.filter(
            class_arm=self.ss1a, teacher=application.created_user, session=self.session,
        ).exists())

    def test_no_form_teacher_assignment_when_not_claimed(self):
        application = self._make_and_approve(is_form_teacher=False)
        self.assertFalse(ClassTeacherAssignment.objects.filter(class_arm=self.ss1a, session=self.session).exists())

    def test_nin_lands_masked_and_qualification_lands_plain(self):
        application = self._make_and_approve()
        user = application.created_user
        nin_field = CustomField.objects.get(entity="staff", key="nin")
        qual_field = CustomField.objects.get(entity="staff", key="qualification")
        self.assertEqual(CustomFieldValue.objects.get(field=nin_field, entity_id=user.id).value, "12345678901")
        self.assertEqual(CustomFieldValue.objects.get(field=qual_field, entity_id=user.id).value, "B.Sc Mathematics")

        # And the masking system that already covers bank account numbers
        # covers this too — a non-superadmin never sees it in full.
        self.client.force_authenticate(self.hr_user)
        res = self.client.get(f"/api/v1/custom-fields/values?entity=staff&entity_id={user.id}")
        self.assertEqual(res.status_code, 200, res.json())
        nin_entry = next(f for f in res.json()["data"] if f["key"] == "nin")
        self.assertEqual(nin_entry["value"], MASKED_VALUE)

    def test_second_teacher_cannot_silently_steal_an_already_claimed_slot(self):
        first = self._make_and_approve()
        first_teacher = first.created_user

        second = self.submit_teacher_application(email="second@x.io", full_name="Second Teacher")
        StaffApplicationSubjectClaim.objects.create(application=second, subject=self.maths, class_arm=self.ss1a)
        services.approve_staff_application(second, self.hr_user)
        second.refresh_from_db()

        assignment = ClassSubjectAssignment.objects.get(class_arm=self.ss1a, subject=self.maths, session=self.session)
        self.assertEqual(assignment.teacher_id, first_teacher.id)  # untouched
        self.assertIn(first_teacher.full_name, second.review_notes)

    def test_approval_is_idempotent(self):
        application = self._make_and_approve()
        user_id_first = application.created_user_id
        services.approve_staff_application(application, self.hr_user)  # calling again should be a no-op
        application.refresh_from_db()
        self.assertEqual(application.created_user_id, user_id_first)
        self.assertEqual(User.objects.filter(email="jane@x.io").count(), 1)

    def test_approve_endpoint_end_to_end(self):
        application = self.submit_teacher_application()
        StaffApplicationSubjectClaim.objects.create(application=application, subject=self.maths, class_arm=self.ss1a)
        self.client.force_authenticate(self.hr_user)
        res = self.client.post(f"/api/v1/staff-applications/{application.id}/approve", {}, format="json")
        self.assertEqual(res.status_code, 200, res.json())
        application.refresh_from_db()
        self.assertEqual(application.status, StaffApplication.Status.APPROVED)


class NonAcademicApprovalTests(StaffOnboardingTestBase):
    def test_approval_creates_a_payout_record_not_a_user(self):
        application = StaffApplication.objects.create(
            staff_type=StaffApplication.StaffType.NON_ACADEMIC,
            full_name="Cleaner Person", phone="08033334444", non_academic_role_title="Cleaner",
        )
        services.approve_staff_application(application, self.hr_user)
        application.refresh_from_db()

        self.assertIsNone(application.created_user_id)
        self.assertIsNotNone(application.created_payout_id)
        payout = application.created_payout
        self.assertEqual(payout.full_name, "Cleaner Person")
        self.assertEqual(payout.title, "Cleaner")
        self.assertFalse(User.objects.filter(full_name="Cleaner Person").exists())


class RejectionTests(StaffOnboardingTestBase):
    def test_rejection_sets_status_and_notes(self):
        application = self.submit_teacher_application()
        self.client.force_authenticate(self.hr_user)
        res = self.client.post(f"/api/v1/staff-applications/{application.id}/review", {
            "status": "rejected", "review_notes": "Could not verify identity.",
        }, format="json")
        self.assertEqual(res.status_code, 200)
        application.refresh_from_db()
        self.assertEqual(application.status, StaffApplication.Status.REJECTED)
        self.assertEqual(application.review_notes, "Could not verify identity.")

    def test_rejected_application_cannot_then_be_approved(self):
        application = self.submit_teacher_application()
        services.reject_staff_application(application, self.hr_user, "No.")
        self.client.force_authenticate(self.hr_user)
        res = self.client.post(f"/api/v1/staff-applications/{application.id}/approve", {}, format="json")
        self.assertEqual(res.status_code, 400)
