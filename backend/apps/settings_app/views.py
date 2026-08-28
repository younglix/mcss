import uuid
from pathlib import Path

from django.conf import settings as django_settings
from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.audit.services import log
from apps.configuration.models import SchoolProfile
from apps.rbac.permissions import HasPermission, get_effective_permissions
from common.responses import failure, success

from .models import SystemSetting
from .serializers import SystemSettingBulkItemSerializer, SystemSettingSerializer


class SettingsPermissionMixin:
    def get_permissions(self):
        code = "settings.view" if self.request.method in ("GET", "HEAD", "OPTIONS") else "settings.edit"
        return [HasPermission(code)]


class PublicBrandingView(APIView):
    """Unauthenticated — only the handful of fields safe to show before
    login (wordmark, logo, theme colors). Never route secret-group keys
    through here; use SettingsListView (auth-gated) for anything else."""

    permission_classes = [AllowAny]

    def get(self, request):
        profile = SchoolProfile.objects.first()
        appearance = {s.key: s.value for s in SystemSetting.objects.filter(group="appearance", is_secret=False)}
        return success(data={
            "name": profile.name if profile else "",
            "short_name": profile.short_name if profile else "",
            "logo": profile.logo if profile else "",
            "favicon": profile.favicon if profile else "",
            "motto": profile.motto if profile else "",
            "primary_color": appearance.get("appearance.primary_color", ""),
            "secondary_color": appearance.get("appearance.secondary_color", ""),
            "light_logo": appearance.get("appearance.light_logo", ""),
            "dark_logo": appearance.get("appearance.dark_logo", ""),
            "landscape_logo": appearance.get("appearance.landscape_logo", ""),
            "address": profile.address if profile else "",
            "phone": profile.phone if profile else "",
            "email": profile.email if profile else "",
        })


class PublicWebsiteContentView(APIView):
    """Unauthenticated — the Landing page's own layout content (the
    website.* settings group: hero, about, academics, fees, gallery, ...).
    Contact details (address/phone/email) live on PublicBrandingView
    instead, since that's already fetched once at app boot everywhere,
    including every public Apply Now page the footer also appears on."""

    permission_classes = [AllowAny]

    def get(self, request):
        content = {
            s.key.split(".", 1)[1]: s.value
            for s in SystemSetting.objects.filter(group="website", is_secret=False)
        }
        return success(data=content)


class AssetUploadView(APIView):
    """Generic image upload for admin-configurable branding fields (school
    logo/favicon, appearance's light/dark/landscape logos, and any future
    admin-managed image) — returns a URL the caller saves as that field's
    own value, same as if it had been pasted in. Not tied to a single
    settings group, so it checks for either editor permission rather than
    reusing one mixin.

    Uploads land in S3 when AWS credentials are configured (STORAGES in
    config/settings/base.py); outside DEBUG, with no credentials set yet,
    this refuses uploads rather than silently writing to local disk nothing
    in production can actually serve."""

    permission_classes = [IsAuthenticated]
    MAX_BYTES = 5 * 1024 * 1024

    def post(self, request):
        perms = get_effective_permissions(request.user)
        if not ("*" in perms or "config.edit" in perms or "settings.edit" in perms):
            return failure(message="You don't have permission to upload branding assets.", status=403)

        if not django_settings.DEBUG and not django_settings.S3_CONFIGURED:
            return failure(message="Image storage isn't configured yet. Add S3 credentials to enable uploads.", status=503)

        file = request.FILES.get("file")
        if not file:
            return failure(message="No file provided.", status=400)
        if not (file.content_type or "").startswith("image/"):
            return failure(message="Only image files are allowed.", status=400)
        if file.size > self.MAX_BYTES:
            return failure(message="Image must be smaller than 5MB.", status=400)

        ext = Path(file.name).suffix.lower() or ".png"
        saved_path = default_storage.save(f"branding/{uuid.uuid4().hex}{ext}", file)
        url = default_storage.url(saved_path)
        log(actor=request.user, action="settings.asset_uploaded", changes={"path": saved_path}, request=request)
        return success(data={"url": url})


class SettingsListView(SettingsPermissionMixin, APIView):
    def get(self, request):
        qs = SystemSetting.objects.all()
        group = request.query_params.get("group")
        if group:
            qs = qs.filter(group=group)
        return success(data=SystemSettingSerializer(qs, many=True).data)


class SettingDetailView(SettingsPermissionMixin, APIView):
    def get(self, request, key):
        setting = get_object_or_404(SystemSetting, key=key)
        return success(data=SystemSettingSerializer(setting).data)

    def patch(self, request, key):
        setting = get_object_or_404(SystemSetting, key=key)
        serializer = SystemSettingSerializer(setting, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log(actor=request.user, action="settings.updated", target=setting,
            changes={"key": key}, request=request)
        return success(message="Setting updated.", data=SystemSettingSerializer(setting).data)


class SettingsBulkUpdateView(SettingsPermissionMixin, APIView):
    def put(self, request):
        items = request.data if isinstance(request.data, list) else request.data.get("settings", [])
        serializer = SystemSettingBulkItemSerializer(data=items, many=True)
        serializer.is_valid(raise_exception=True)

        updated_keys = []
        missing_keys = []
        for item in serializer.validated_data:
            setting = SystemSetting.objects.filter(key=item["key"]).first()
            if setting is None:
                missing_keys.append(item["key"])
                continue
            setting.set_value(item["value"])
            setting.save()
            updated_keys.append(item["key"])

        if missing_keys:
            return failure(message="Some setting keys were not found.",
                            errors={"missing_keys": missing_keys, "updated_keys": updated_keys}, status=400)

        log(actor=request.user, action="settings.bulk_updated", changes={"keys": updated_keys}, request=request)
        return success(message="Settings updated.", data={"updated_keys": updated_keys})
