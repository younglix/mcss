"""Self-service Edit Profile (Requirement 1): dynamic per-role fields,
sensitive-field masking, and the Super Admin's global open/closed switch
over everyone's self-editing.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.academics.models import Student
from apps.settings_app.models import SystemSetting

from .models import CustomField, CustomFieldValue
from .views import MASKED_VALUE

User = get_user_model()


class ProfileFieldsTestBase(TestCase):
    def setUp(self):
        self.title_field = CustomField.objects.create(
            entity=CustomField.Entity.STAFF, key="title", label="Title", field_type=CustomField.FieldType.TEXT,
        )
        self.nin_field = CustomField.objects.create(
            entity=CustomField.Entity.STAFF, key="nin", label="NIN", field_type=CustomField.FieldType.TEXT,
            is_sensitive=True,
        )
        self.staff = User.objects.create(full_name="Staff One", email="staff1@x.io", user_type="staff", is_active=True)
        self.superadmin = User.objects.create(
            full_name="Super Admin", email="sa@x.io", user_type="staff", is_active=True, is_superadmin=True,
        )
        self.client = APIClient()

    def open_switch(self, is_open):
        SystemSetting.objects.update_or_create(
            key="profiles.self_edit_open", defaults={"value": is_open, "group": "profiles"},
        )


class SelfServiceResolutionTests(ProfileFieldsTestBase):
    def test_staff_sees_their_own_staff_fields(self):
        self.client.force_authenticate(self.staff)
        res = self.client.get("/api/v1/custom-fields/my-values")
        body = res.json()["data"]
        self.assertEqual(body["entity"], "staff")
        self.assertEqual({f["key"] for f in body["fields"]}, {"title", "nin"})

    def test_parent_entity_works_end_to_end(self):
        parent = User.objects.create(full_name="Parent One", email="parent1@x.io", user_type="parent", is_active=True)
        CustomField.objects.create(entity=CustomField.Entity.PARENT, key="occupation", label="Occupation")
        self.client.force_authenticate(parent)
        res = self.client.get("/api/v1/custom-fields/my-values")
        body = res.json()["data"]
        self.assertEqual(body["entity"], "parent")
        self.assertEqual([f["key"] for f in body["fields"]], ["occupation"])

    def test_student_resolves_to_their_student_id_not_user_id(self):
        student_user = User.objects.create(full_name="Student One", identifier="STU1", user_type="student", is_active=True)
        student = Student.objects.create(user=student_user)
        CustomField.objects.create(entity=CustomField.Entity.STUDENT, key="blood_group", label="Blood Group")

        self.client.force_authenticate(student_user)
        self.client.put(
            "/api/v1/custom-fields/my-values",
            {"values": [{"field_id": str(CustomField.objects.get(key="blood_group").id), "value": "O+"}]},
            format="json",
        )
        # the value must be stored against the Student row's id, not the User's
        stored = CustomFieldValue.objects.get(field__key="blood_group")
        self.assertEqual(stored.entity_id, student.id)
        self.assertNotEqual(stored.entity_id, student_user.id)


class SelfServiceWriteTests(ProfileFieldsTestBase):
    def test_self_save_and_read_back(self):
        self.client.force_authenticate(self.staff)
        res = self.client.put(
            "/api/v1/custom-fields/my-values",
            {"values": [{"field_id": str(self.title_field.id), "value": "Bursar"}]},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        value = CustomFieldValue.objects.get(field=self.title_field, entity_id=self.staff.id)
        self.assertEqual(value.value, "Bursar")

    def test_cannot_write_another_users_values(self):
        """The write path resolves entity_id server-side from the caller —
        there's no field in the PUT body a client could use to target
        someone else's profile."""
        other = User.objects.create(full_name="Staff Two", email="staff2@x.io", user_type="staff", is_active=True)
        CustomFieldValue.objects.create(field=self.title_field, entity_id=other.id, value="Teacher")

        self.client.force_authenticate(self.staff)
        self.client.put(
            "/api/v1/custom-fields/my-values",
            {"values": [{"field_id": str(self.title_field.id), "value": "Principal"}]},
            format="json",
        )
        # other's value is untouched; only the caller's own was ever writable
        other_value = CustomFieldValue.objects.get(field=self.title_field, entity_id=other.id)
        self.assertEqual(other_value.value, "Teacher")


class LockSwitchTests(ProfileFieldsTestBase):
    def test_open_switch_allows_self_save(self):
        self.open_switch(True)
        self.client.force_authenticate(self.staff)
        res = self.client.put(
            "/api/v1/custom-fields/my-values",
            {"values": [{"field_id": str(self.title_field.id), "value": "Bursar"}]},
            format="json",
        )
        self.assertEqual(res.status_code, 200)

    def test_closed_switch_blocks_self_save(self):
        self.open_switch(False)
        self.client.force_authenticate(self.staff)
        res = self.client.put(
            "/api/v1/custom-fields/my-values",
            {"values": [{"field_id": str(self.title_field.id), "value": "Bursar"}]},
            format="json",
        )
        self.assertEqual(res.status_code, 403)
        self.assertFalse(CustomFieldValue.objects.filter(field=self.title_field, entity_id=self.staff.id).exists())

    def test_closed_switch_still_allows_read(self):
        self.open_switch(False)
        self.client.force_authenticate(self.staff)
        res = self.client.get("/api/v1/custom-fields/my-values")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["data"]["locked"])

    def test_superadmin_bypasses_the_switch(self):
        """The Super Admin can always edit — their own profile included —
        regardless of the global switch (they also have a separate admin
        path onto anyone else's, but this confirms the switch itself never
        blocks them)."""
        self.open_switch(False)
        self.client.force_authenticate(self.superadmin)
        res = self.client.put(
            "/api/v1/custom-fields/my-values",
            {"values": [{"field_id": str(self.title_field.id), "value": "Whatever"}]},
            format="json",
        )
        self.assertEqual(res.status_code, 200)

    def test_reopening_the_switch_unlocks_everyone_again(self):
        self.open_switch(False)
        self.client.force_authenticate(self.staff)
        blocked = self.client.put(
            "/api/v1/custom-fields/my-values",
            {"values": [{"field_id": str(self.title_field.id), "value": "Bursar"}]},
            format="json",
        )
        self.assertEqual(blocked.status_code, 403)

        self.open_switch(True)
        reopened = self.client.put(
            "/api/v1/custom-fields/my-values",
            {"values": [{"field_id": str(self.title_field.id), "value": "Bursar"}]},
            format="json",
        )
        self.assertEqual(reopened.status_code, 200)


class SensitiveFieldMaskingTests(ProfileFieldsTestBase):
    def setUp(self):
        super().setUp()
        CustomFieldValue.objects.create(field=self.nin_field, entity_id=self.staff.id, value="12345678901")

    def test_owner_sees_their_own_sensitive_value_masked(self):
        self.client.force_authenticate(self.staff)
        res = self.client.get("/api/v1/custom-fields/my-values")
        nin_row = next(f for f in res.json()["data"]["fields"] if f["key"] == "nin")
        self.assertTrue(nin_row["is_masked"])
        self.assertEqual(nin_row["value"], MASKED_VALUE)

    def test_superadmin_sees_it_in_full_via_admin_endpoint(self):
        self.client.force_authenticate(self.superadmin)
        res = self.client.get(f"/api/v1/custom-fields/values?entity=staff&entity_id={self.staff.id}")
        nin_row = next(f for f in res.json()["data"] if f["key"] == "nin")
        self.assertFalse(nin_row["is_masked"])
        self.assertEqual(nin_row["value"], "12345678901")

    def test_hr_does_not_see_it_in_full_either(self):
        """"Only fully visible to the Super Admin" — explicitly not even HR,
        who otherwise holds custom_fields.view for this exact screen."""
        from apps.rbac.models import Permission, Role, RolePermission, UserRole

        hr_role = Role.objects.create(name="HR", slug="hr-test", is_system=False)
        perm, _ = Permission.objects.get_or_create(
            code="custom_fields.view", defaults={"module": "custom_fields", "action": "view"},
        )
        RolePermission.objects.create(role=hr_role, permission=perm)
        hr_user = User.objects.create(full_name="HR One", email="hr1@x.io", user_type="staff", is_active=True)
        UserRole.objects.create(user=hr_user, role=hr_role)

        self.client.force_authenticate(hr_user)
        res = self.client.get(f"/api/v1/custom-fields/values?entity=staff&entity_id={self.staff.id}")
        nin_row = next(f for f in res.json()["data"] if f["key"] == "nin")
        self.assertTrue(nin_row["is_masked"])
        self.assertEqual(nin_row["value"], MASKED_VALUE)

    def test_saving_the_masked_placeholder_does_not_overwrite_the_real_value(self):
        """A form that only ever shows the caller •••••• for a sensitive
        field must not be able to accidentally blank/overwrite it just by
        submitting the page unchanged."""
        self.client.force_authenticate(self.staff)
        self.client.put(
            "/api/v1/custom-fields/my-values",
            {"values": [{"field_id": str(self.nin_field.id), "value": MASKED_VALUE}]},
            format="json",
        )
        value = CustomFieldValue.objects.get(field=self.nin_field, entity_id=self.staff.id)
        self.assertEqual(value.value, "12345678901")

    def test_plain_text_at_rest_not_encrypted(self):
        """Spec: leave it plain text in the DB, for the Super Admin to view —
        no encryption, unlike SystemSetting.is_secret's Fernet scheme."""
        stored = CustomFieldValue.objects.get(field=self.nin_field, entity_id=self.staff.id)
        self.assertEqual(stored.value, "12345678901")


class ProfileCompletenessTests(ProfileFieldsTestBase):
    """Requirement 9 — Super Admin can see existing users missing a
    required field, including one added long after those users existed."""

    def test_lists_only_users_missing_a_required_field(self):
        self.qualification_field = CustomField.objects.create(
            entity=CustomField.Entity.STAFF, key="qualification", label="Qualification",
            field_type=CustomField.FieldType.TEXT, required=True,
        )
        complete_staff = User.objects.create(full_name="Complete Staff", email="complete@x.io", user_type="staff", is_active=True)
        CustomFieldValue.objects.create(field=self.qualification_field, entity_id=complete_staff.id, value="B.Sc")
        # self.staff (from setUp) has no qualification value at all.

        self.client.force_authenticate(self.superadmin)
        res = self.client.get("/api/v1/custom-fields/completeness?entity=staff")
        self.assertEqual(res.status_code, 200)
        rows = {r["name"]: r["missing_fields"] for r in res.json()["data"]}
        self.assertIn("Staff One", rows)
        self.assertEqual(rows["Staff One"], ["Qualification"])
        self.assertNotIn("Complete Staff", rows)

    def test_a_field_added_after_users_already_exist_shows_up_immediately(self):
        """The exact scenario in point 7 of the spec: 500 existing staff,
        Super Admin adds a new required field later — no re-registration,
        no migration, they just show up as incomplete right away."""
        self.client.force_authenticate(self.superadmin)
        res = self.client.get("/api/v1/custom-fields/completeness?entity=staff")
        self.assertEqual(res.json()["data"], [])  # no required fields yet

        CustomField.objects.create(
            entity=CustomField.Entity.STAFF, key="bvn", label="Bank Verification Number",
            field_type=CustomField.FieldType.TEXT, required=True,
        )
        res = self.client.get("/api/v1/custom-fields/completeness?entity=staff")
        rows = {r["name"]: r["missing_fields"] for r in res.json()["data"]}
        self.assertEqual(rows.get("Staff One"), ["Bank Verification Number"])

    def test_student_entity_keys_by_student_id_not_user_id(self):
        from datetime import date

        student_user = User.objects.create(full_name="Kid One", email="kid@x.io", user_type="student", is_active=True)
        student = Student.objects.create(user=student_user, date_of_birth=date(2012, 1, 1))
        CustomField.objects.create(
            entity=CustomField.Entity.STUDENT, key="allergy", label="Allergy", field_type=CustomField.FieldType.TEXT, required=True,
        )

        self.client.force_authenticate(self.superadmin)
        res = self.client.get("/api/v1/custom-fields/completeness?entity=student")
        rows = {r["entity_id"]: r["name"] for r in res.json()["data"]}
        self.assertIn(str(student.id), rows)
        self.assertNotIn(str(student_user.id), rows)  # keyed by Student.id, not User.id

    def test_missing_entity_param_is_rejected(self):
        self.client.force_authenticate(self.superadmin)
        res = self.client.get("/api/v1/custom-fields/completeness")
        self.assertEqual(res.status_code, 400)

    def test_requires_permission(self):
        res = self.client.get("/api/v1/custom-fields/completeness?entity=staff")
        self.assertEqual(res.status_code, 401)
