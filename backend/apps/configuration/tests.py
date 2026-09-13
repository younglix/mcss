"""SiteMedia — the shared Super-Admin-managed image/video list behind the
login page's desktop slider (this pass), and later the landing page's
multi-image sections and the school album (same model, different
`placement`). Also covers PublicBrandingView's new login-slider settings
(transition style/duration)."""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.rbac.models import Permission, Role, RolePermission, UserRole
from apps.settings_app.models import SystemSetting

from .models import SiteMedia

User = get_user_model()


class SiteMediaTestBase(TestCase):
    def setUp(self):
        self.role = Role.objects.create(name="Config Admin", slug="config_admin")
        for code in ["config.view", "config.edit"]:
            perm = Permission.objects.create(code=code, module="config", action=code.split(".")[1])
            RolePermission.objects.create(role=self.role, permission=perm)
        self.admin = User.objects.create(full_name="Admin One", email="cfgadmin@x.io", user_type="staff", is_active=True)
        UserRole.objects.create(user=self.admin, role=self.role)

        self.outsider = User.objects.create(full_name="No Perms", email="cfgoutsider@x.io", user_type="staff", is_active=True)
        self.client = APIClient()


class SiteMediaAdminCrudTests(SiteMediaTestBase):
    def test_creating_media_assigns_the_next_order_within_its_placement(self):
        # SiteMediaView (like every other ConfigPermissionMixin ListCreateAPIView
        # in this app) doesn't wrap create/retrieve in the {success, data}
        # envelope — only success()/failure() calls and paginated lists get that.
        self.client.force_authenticate(self.admin)
        res1 = self.client.post("/api/v1/config/site-media", {
            "placement": SiteMedia.Placement.LOGIN_SLIDER, "url": "/media/login1.jpg",
        }, format="json")
        res2 = self.client.post("/api/v1/config/site-media", {
            "placement": SiteMedia.Placement.LOGIN_SLIDER, "url": "/media/login2.jpg",
        }, format="json")
        self.assertEqual(res1.status_code, 201, res1.json())
        self.assertEqual(res2.status_code, 201, res2.json())
        self.assertEqual(res1.json()["order"], 1)
        self.assertEqual(res2.json()["order"], 2)

    def test_order_sequences_are_independent_per_placement(self):
        self.client.force_authenticate(self.admin)
        self.client.post("/api/v1/config/site-media", {"placement": "login_slider", "url": "/a.jpg"}, format="json")
        res = self.client.post("/api/v1/config/site-media", {"placement": "hero", "url": "/b.jpg"}, format="json")
        self.assertEqual(res.json()["order"], 1)  # not 2 — a different placement's own sequence

    def test_listing_filters_by_placement(self):
        SiteMedia.objects.create(placement="login_slider", url="/a.jpg", order=1)
        SiteMedia.objects.create(placement="hero", url="/b.jpg", order=1)
        self.client.force_authenticate(self.admin)
        res = self.client.get("/api/v1/config/site-media?placement=login_slider")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()["data"]), 1)
        self.assertEqual(res.json()["data"][0]["url"], "/a.jpg")

    def test_can_update_order_and_delete(self):
        media = SiteMedia.objects.create(placement="login_slider", url="/a.jpg", order=1)
        self.client.force_authenticate(self.admin)
        patch_res = self.client.patch(f"/api/v1/config/site-media/{media.id}", {"order": 5}, format="json")
        self.assertEqual(patch_res.status_code, 200, patch_res.json())
        media.refresh_from_db()
        self.assertEqual(media.order, 5)

        del_res = self.client.delete(f"/api/v1/config/site-media/{media.id}")
        self.assertEqual(del_res.status_code, 204)
        self.assertFalse(SiteMedia.objects.filter(id=media.id).exists())

    def test_album_placement_supports_mixed_image_and_video_items(self):
        # The School Album (item 9) is the one placement that mixes
        # media_type=video (a pasted YouTube/Vimeo/direct-file URL, not an
        # uploaded file — see AlbumManager.jsx) alongside ordinary images.
        self.client.force_authenticate(self.admin)
        img_res = self.client.post("/api/v1/config/site-media", {
            "placement": "album", "media_type": "image", "url": "/media/album/photo.jpg",
        }, format="json")
        vid_res = self.client.post("/api/v1/config/site-media", {
            "placement": "album", "media_type": "video", "url": "https://www.youtube.com/watch?v=abc123",
        }, format="json")
        self.assertEqual(img_res.status_code, 201, img_res.json())
        self.assertEqual(vid_res.status_code, 201, vid_res.json())
        self.assertEqual(img_res.json()["media_type"], "image")
        self.assertEqual(vid_res.json()["media_type"], "video")

        list_res = self.client.get("/api/v1/config/site-media?placement=album")
        types = {row["media_type"] for row in list_res.json()["data"]}
        self.assertEqual(types, {"image", "video"})

    def test_requires_config_edit_to_write(self):
        self.client.force_authenticate(self.outsider)
        res = self.client.post("/api/v1/config/site-media", {"placement": "login_slider", "url": "/a.jpg"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_requires_authentication_to_read_the_admin_list(self):
        res = self.client.get("/api/v1/config/site-media?placement=login_slider")
        self.assertEqual(res.status_code, 401)


class PublicSiteMediaTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_placement_is_required(self):
        res = self.client.get("/api/v1/config/site-media/public")
        self.assertEqual(res.status_code, 400)

    def test_unauthenticated_read_returns_only_the_requested_placement_in_order(self):
        SiteMedia.objects.create(placement="login_slider", url="/c.jpg", order=2)
        SiteMedia.objects.create(placement="login_slider", url="/a.jpg", order=1)
        SiteMedia.objects.create(placement="hero", url="/hero.jpg", order=1)
        res = self.client.get("/api/v1/config/site-media/public?placement=login_slider")
        self.assertEqual(res.status_code, 200)
        urls = [row["url"] for row in res.json()["data"]]
        self.assertEqual(urls, ["/a.jpg", "/c.jpg"])

    def test_empty_placement_returns_an_empty_list_not_an_error(self):
        res = self.client.get("/api/v1/config/site-media/public?placement=login_slider")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["data"], [])


class PublicBrandingLoginSettingsTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_defaults_when_no_login_settings_exist_yet(self):
        res = self.client.get("/api/v1/settings/public-branding")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["data"]["login_transition_style"], "fade")
        self.assertEqual(res.json()["data"]["login_transition_duration"], 5)

    def test_reflects_configured_values(self):
        SystemSetting.objects.create(key="login.transition_style", group="login", value="zoom_in")
        SystemSetting.objects.create(key="login.transition_duration", group="login", value=8)
        res = self.client.get("/api/v1/settings/public-branding")
        self.assertEqual(res.json()["data"]["login_transition_style"], "zoom_in")
        self.assertEqual(res.json()["data"]["login_transition_duration"], 8)
