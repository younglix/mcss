"""Self-service profile picture (accounts.User.avatar) — 40KB hard limit,
image-only, applies uniformly to every account type since they all share
the one User model."""

import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

User = get_user_model()


class MyAvatarViewTests(TestCase):
    def setUp(self):
        self.tmp_media = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.tmp_media, ignore_errors=True)
        self.user = User.objects.create(full_name="Avatar Tester", email="avatartest@x.io", user_type="staff", is_active=True)
        self.other = User.objects.create(full_name="Someone Else", email="someoneelse@x.io", user_type="staff", is_active=True)
        self.client = APIClient()

    def test_requires_authentication(self):
        png = SimpleUploadedFile("photo.png", b"\x89PNG small", content_type="image/png")
        res = self.client.post("/api/v1/auth/me/avatar", {"file": png}, format="multipart")
        self.assertEqual(res.status_code, 401)

    def test_storage_not_configured_outside_debug_refuses_upload(self):
        self.client.force_authenticate(self.user)
        png = SimpleUploadedFile("photo.png", b"\x89PNG small", content_type="image/png")
        res = self.client.post("/api/v1/auth/me/avatar", {"file": png}, format="multipart")
        self.assertEqual(res.status_code, 503)

    @override_settings(DEBUG=True)
    def test_uploading_a_small_image_sets_the_users_own_avatar(self):
        self.client.force_authenticate(self.user)
        png = SimpleUploadedFile("photo.png", b"\x89PNG small avatar bytes", content_type="image/png")
        with override_settings(MEDIA_ROOT=self.tmp_media):
            res = self.client.post("/api/v1/auth/me/avatar", {"file": png}, format="multipart")
        self.assertEqual(res.status_code, 200, res.json())
        self.user.refresh_from_db()
        self.assertTrue(self.user.avatar)
        self.assertEqual(res.json()["data"]["avatar"], self.user.avatar)

    @override_settings(DEBUG=True)
    def test_rejects_a_file_over_40kb(self):
        self.client.force_authenticate(self.user)
        big = SimpleUploadedFile("photo.png", b"\x89" + b"x" * (40 * 1024), content_type="image/png")
        with override_settings(MEDIA_ROOT=self.tmp_media):
            res = self.client.post("/api/v1/auth/me/avatar", {"file": big}, format="multipart")
        self.assertEqual(res.status_code, 400)
        self.user.refresh_from_db()
        self.assertFalse(self.user.avatar)

    @override_settings(DEBUG=True)
    def test_rejects_a_non_image_file(self):
        self.client.force_authenticate(self.user)
        pdf = SimpleUploadedFile("doc.pdf", b"%PDF-1.4 fake", content_type="application/pdf")
        with override_settings(MEDIA_ROOT=self.tmp_media):
            res = self.client.post("/api/v1/auth/me/avatar", {"file": pdf}, format="multipart")
        self.assertEqual(res.status_code, 400)

    @override_settings(DEBUG=True)
    def test_removing_the_avatar_clears_it(self):
        self.user.avatar = "https://example.com/avatars/old.png"
        self.user.save(update_fields=["avatar"])
        self.client.force_authenticate(self.user)
        res = self.client.delete("/api/v1/auth/me/avatar")
        self.assertEqual(res.status_code, 200, res.json())
        self.user.refresh_from_db()
        self.assertIsNone(self.user.avatar)

    @override_settings(DEBUG=True)
    def test_a_user_can_only_ever_set_their_own_avatar(self):
        """No user_id in the request body/URL at all — nothing to spoof."""
        self.client.force_authenticate(self.user)
        png = SimpleUploadedFile("photo.png", b"\x89PNG small avatar bytes", content_type="image/png")
        with override_settings(MEDIA_ROOT=self.tmp_media):
            self.client.post("/api/v1/auth/me/avatar", {"file": png}, format="multipart")
        self.other.refresh_from_db()
        self.assertFalse(self.other.avatar)

    def test_existing_users_without_an_avatar_are_unaffected(self):
        self.assertIsNone(self.user.avatar)
        self.client.force_authenticate(self.user)
        res = self.client.get("/api/v1/auth/me")
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.json()["data"]["user"]["avatar"])
