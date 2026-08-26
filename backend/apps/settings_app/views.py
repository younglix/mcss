from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from apps.audit.services import log
from apps.configuration.models import SchoolProfile
from apps.rbac.permissions import HasPermission
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
        })


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
