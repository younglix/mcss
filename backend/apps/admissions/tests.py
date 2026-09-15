"""Public admission applications collecting dynamic "student"/"parent"
custom fields — the same dynamic-field architecture as
apps.staff_onboarding: pending answers live on the application until
approval, then promote_pending_values() copies them into real
CustomFieldValue rows for the new Student/guardian, using the exact same
field definitions the ongoing profile-edit screens already render."""

from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.academics.models import ClassBandingConfig, Student
from apps.configuration.models import AcademicSession, ClassArm, FeeCategory, SchoolClass
from apps.custom_fields.models import CustomField, CustomFieldValue
from apps.custom_fields.services import MASKED_VALUE
from apps.finance.models import FeeStructure, Invoice, Payment
from apps.rbac.models import Permission, Role, RolePermission, UserRole
from apps.settings_app.models import SystemSetting

from . import services
from .models import Application, ApplicationFieldValue

User = get_user_model()


class AdmissionsDynamicFieldsTestBase(TestCase):
    def setUp(self):
        self.allergy_field = CustomField.objects.create(
            entity=CustomField.Entity.STUDENT, key="allergy", label="Allergy", field_type="text", required=True,
        )
        self.occupation_field = CustomField.objects.create(
            entity=CustomField.Entity.PARENT, key="occupation", label="Occupation", field_type="text", required=True,
        )
        SystemSetting.objects.create(key="student_admission.is_open", group="student_admission", value=True)
        self.jss1 = SchoolClass.objects.create(name="JSS 1", level_order=1)

        self.admin_role = Role.objects.create(name="Admissions Admin", slug="admissions-admin")
        for code in ["admissions.view", "admissions.edit", "admissions.review", "custom_fields.view"]:
            perm = Permission.objects.create(code=code, module=code.split(".")[0], action=code.split(".")[1])
            RolePermission.objects.create(role=self.admin_role, permission=perm)
        self.reviewer = User.objects.create(full_name="Reviewer One", email="reviewer@x.io", user_type="staff", is_active=True)
        UserRole.objects.create(user=self.reviewer, role=self.admin_role)
        self.superadmin = User.objects.create(
            full_name="Super Admin", email="sa@x.io", user_type="staff", is_active=True, is_superadmin=True,
        )
        self.client = APIClient()

    def base_payload(self, **overrides):
        payload = {
            "level": "secondary", "surname": "Doe", "first_name": "Jane", "date_of_birth": "2012-01-01",
            "gender": "female", "present_class": "JSS 1", "schools_attended": "Sunrise Primary",
            "religion": "christianity", "nationality": "Nigerian", "state_of_origin": "Lagos",
            "email": "jane.doe.applicant@x.io", "address": "1 Test Street", "class_applying_for": str(self.jss1.id),
            "has_guardian": True, "guardian_name": "John Doe", "guardian_phone": "08011112222",
            "father_name": "John Doe", "father_phone": "08011112222",
            "mother_name": "Mary Doe", "mother_phone": "08033334444",
            "guardian_signature_name": "John Doe",
        }
        payload.update(overrides)
        return payload


class PublicConfigAndSubmitTests(AdmissionsDynamicFieldsTestBase):
    def test_config_lists_student_and_parent_custom_fields(self):
        res = self.client.get("/api/v1/admissions/apply/config")
        body = res.json()["data"]
        self.assertTrue(any(f["key"] == "allergy" for f in body["student_custom_fields"]))
        self.assertTrue(any(f["key"] == "occupation" for f in body["parent_custom_fields"]))

    def test_submit_requires_student_dynamic_fields(self):
        res = self.client.post("/api/v1/admissions/apply", self.base_payload(), format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("custom_field_values", res.json()["errors"])

    def test_submit_does_not_require_parent_fields_without_a_guardian(self):
        payload = self.base_payload(has_guardian=False)
        payload["custom_field_values"] = [{"field_id": str(self.allergy_field.id), "value": "Peanuts"}]
        res = self.client.post("/api/v1/admissions/apply", payload, format="json")
        self.assertEqual(res.status_code, 201, res.json())

    def test_submit_with_both_dynamic_field_types_succeeds(self):
        payload = self.base_payload()
        payload["custom_field_values"] = [
            {"field_id": str(self.allergy_field.id), "value": "Peanuts"},
            {"field_id": str(self.occupation_field.id), "value": "Engineer"},
        ]
        res = self.client.post("/api/v1/admissions/apply", payload, format="json")
        self.assertEqual(res.status_code, 201, res.json())
        application = Application.objects.get(reference_number=res.json()["data"]["reference_number"])
        self.assertEqual(application.field_values.count(), 2)

    def test_a_newly_added_field_is_immediately_required_with_no_code_change(self):
        CustomField.objects.create(entity=CustomField.Entity.STUDENT, key="blood_group", label="Blood Group", field_type="text", required=True)
        res = self.client.get("/api/v1/admissions/apply/config")
        self.assertTrue(any(f["key"] == "blood_group" for f in res.json()["data"]["student_custom_fields"]))

        payload = self.base_payload()
        payload["custom_field_values"] = [
            {"field_id": str(self.allergy_field.id), "value": "Peanuts"},
            {"field_id": str(self.occupation_field.id), "value": "Engineer"},
        ]
        res = self.client.post("/api/v1/admissions/apply", payload, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("Blood Group", res.json()["errors"]["custom_field_values"][0])


class ApprovalPromotionTests(AdmissionsDynamicFieldsTestBase):
    def _submit_and_approve(self, has_guardian=True):
        payload = self.base_payload(has_guardian=has_guardian, email=f"applicant-{has_guardian}@x.io")
        payload["custom_field_values"] = [{"field_id": str(self.allergy_field.id), "value": "Peanuts"}]
        if has_guardian:
            payload["custom_field_values"].append({"field_id": str(self.occupation_field.id), "value": "Engineer"})
        res = self.client.post("/api/v1/admissions/apply", payload, format="json")
        self.assertEqual(res.status_code, 201, res.json())
        application = Application.objects.get(reference_number=res.json()["data"]["reference_number"])
        student = services.approve_application(application, self.reviewer)
        application.refresh_from_db()
        return application, student

    def test_student_field_lands_on_the_real_student(self):
        application, student = self._submit_and_approve()
        self.assertEqual(CustomFieldValue.objects.get(field=self.allergy_field, entity_id=student.id).value, "Peanuts")

    def test_parent_field_lands_on_the_real_guardian_user(self):
        application, student = self._submit_and_approve()
        guardian_id = student.guardian_user_id
        self.assertIsNotNone(guardian_id)
        self.assertEqual(CustomFieldValue.objects.get(field=self.occupation_field, entity_id=guardian_id).value, "Engineer")

    def test_no_guardian_means_no_parent_field_promotion_and_no_crash(self):
        application, student = self._submit_and_approve(has_guardian=False)
        self.assertIsNone(student.guardian_user_id)
        self.assertFalse(CustomFieldValue.objects.filter(field=self.occupation_field).exists())

    def test_pending_sensitive_field_is_masked_for_non_superadmin_reviewer(self):
        sensitive_field = CustomField.objects.create(
            entity=CustomField.Entity.STUDENT, key="medical_id", label="Medical ID", field_type="text", is_sensitive=True,
        )
        payload = self.base_payload(has_guardian=False)
        payload["class_applying_for_id"] = payload.pop("class_applying_for")
        application = Application.objects.create(**payload)
        ApplicationFieldValue.objects.create(application=application, field=self.allergy_field, value="Peanuts")
        ApplicationFieldValue.objects.create(application=application, field=sensitive_field, value="SECRET-123")

        self.client.force_authenticate(self.reviewer)
        res = self.client.get(f"/api/v1/admissions/applications/{application.id}")
        entry = next(f for f in res.json()["field_values"] if f["field_key"] == "medical_id")
        self.assertEqual(entry["value"], MASKED_VALUE)

        self.client.force_authenticate(self.superadmin)
        res = self.client.get(f"/api/v1/admissions/applications/{application.id}")
        entry = next(f for f in res.json()["field_values"] if f["field_key"] == "medical_id")
        self.assertEqual(entry["value"], "SECRET-123")

    def test_approval_is_idempotent_for_dynamic_fields(self):
        application, student = self._submit_and_approve()
        services.approve_application(application, self.reviewer)  # second call, safe no-op
        self.assertEqual(CustomFieldValue.objects.filter(field=self.allergy_field, entity_id=student.id).count(), 1)


class FullOnboardingActivationTests(AdmissionsDynamicFieldsTestBase):
    """The reconfirmed end-to-end admission chain: apply -> approve ->
    Acceptance Fee raised & paid -> First School Fee raised & paid ->
    registration number generated. Before this fix, that last step never
    activated the student or placed them anywhere — they stayed
    status=pending with class_arm=None forever, invisible to the class-arm
    reallocation engine (which only ever considers status=ACTIVE students in
    a real arm). See apps.finance.models._maybe_generate_registration_number
    / _place_in_holding_arm."""

    def setUp(self):
        super().setUp()
        self.session = AcademicSession.objects.create(
            name="2026/2027", start_date=date(2026, 9, 1), end_date=date(2027, 7, 31), is_current=True,
        )
        self.tuition = FeeCategory.objects.create(name="Tuition", is_recurring=True, amount=Decimal("50000"))
        FeeStructure.objects.create(
            category=self.tuition, school_class=self.jss1, session=self.session, amount=Decimal("50000"),
        )

    def _approve_and_pay_through_registration(self):
        payload = self.base_payload()
        payload["custom_field_values"] = [
            {"field_id": str(self.allergy_field.id), "value": "Peanuts"},
            {"field_id": str(self.occupation_field.id), "value": "Engineer"},
        ]
        res = self.client.post("/api/v1/admissions/apply", payload, format="json")
        self.assertEqual(res.status_code, 201, res.json())
        application = Application.objects.get(reference_number=res.json()["data"]["reference_number"])
        student = services.approve_application(application, self.reviewer)

        acceptance = student.invoices.get(purpose=Invoice.Purpose.ACCEPTANCE_FEE)
        Payment.objects.create(invoice=acceptance, amount=acceptance.amount)
        acceptance.refresh_status()

        for invoice in student.invoices.filter(purpose=Invoice.Purpose.FIRST_SCHOOL_FEE):
            Payment.objects.create(invoice=invoice, amount=invoice.amount)
            invoice.refresh_status()

        student.refresh_from_db()
        return student

    def test_student_is_activated_and_seated_in_the_holding_arm(self):
        holding_arm = ClassArm.objects.create(school_class=self.jss1, name="N_S")
        ClassBandingConfig.objects.create(school_class=self.jss1, holding_arm=holding_arm, enabled=True)

        student = self._approve_and_pay_through_registration()

        self.assertTrue(student.registration_number)
        self.assertEqual(student.status, Student.Status.ACTIVE)
        self.assertEqual(student.class_arm_id, holding_arm.id)

    def test_manually_set_class_arm_is_never_overwritten(self):
        holding_arm = ClassArm.objects.create(school_class=self.jss1, name="N_S")
        real_arm = ClassArm.objects.create(school_class=self.jss1, name="A")
        ClassBandingConfig.objects.create(school_class=self.jss1, holding_arm=holding_arm, enabled=True)

        payload = self.base_payload()
        payload["custom_field_values"] = [
            {"field_id": str(self.allergy_field.id), "value": "Peanuts"},
            {"field_id": str(self.occupation_field.id), "value": "Engineer"},
        ]
        res = self.client.post("/api/v1/admissions/apply", payload, format="json")
        application = Application.objects.get(reference_number=res.json()["data"]["reference_number"])
        student = services.approve_application(application, self.reviewer)
        # A staff member hand-assigns the real arm before registration completes.
        student.class_arm = real_arm
        student.save(update_fields=["class_arm"])

        acceptance = student.invoices.get(purpose=Invoice.Purpose.ACCEPTANCE_FEE)
        Payment.objects.create(invoice=acceptance, amount=acceptance.amount)
        acceptance.refresh_status()
        for invoice in student.invoices.filter(purpose=Invoice.Purpose.FIRST_SCHOOL_FEE):
            Payment.objects.create(invoice=invoice, amount=invoice.amount)
            invoice.refresh_status()

        student.refresh_from_db()
        self.assertEqual(student.status, Student.Status.ACTIVE)
        self.assertEqual(student.class_arm_id, real_arm.id)  # untouched, not reset to N_S

    def test_no_banding_config_still_activates_with_no_class_arm(self):
        """A class with no holding arm configured (e.g. banding never set up
        for it) must not crash registration — the student still activates,
        just with no class_arm, exactly like before this fix (a staff member
        assigns it by hand)."""
        student = self._approve_and_pay_through_registration()
        self.assertEqual(student.status, Student.Status.ACTIVE)
        self.assertIsNone(student.class_arm_id)

    def test_visible_on_self_service_profile_and_parent_portal_once_active(self):
        holding_arm = ClassArm.objects.create(school_class=self.jss1, name="N_S")
        ClassBandingConfig.objects.create(school_class=self.jss1, holding_arm=holding_arm, enabled=True)
        student = self._approve_and_pay_through_registration()

        self.client.force_authenticate(student.user)
        res = self.client.get("/api/v1/academics/students/mine")
        self.assertEqual(res.json()["data"]["class_arm_label"], str(holding_arm))

        self.client.force_authenticate(student.guardian_user)
        res = self.client.get("/api/v1/academics/students/my-children")
        child = next(c for c in res.json()["data"] if c["id"] == str(student.id))
        self.assertEqual(child["class_arm_label"], str(holding_arm))
