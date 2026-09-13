from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.rbac.models import Permission, Role, RolePermission, UserRole
from apps.settings_app.models import SystemSetting

from . import services

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
