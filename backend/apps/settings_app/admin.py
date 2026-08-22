from django.contrib import admin

from .models import SystemSetting


@admin.register(SystemSetting)
class SystemSettingAdmin(admin.ModelAdmin):
    list_display = ["key", "group", "is_secret", "masked_value", "updated_at"]
    list_filter = ["group", "is_secret"]
    search_fields = ["key"]

    def get_fields(self, request, obj=None):
        if obj and obj.is_secret:
            return ["key", "group", "is_secret", "masked_value"]
        return ["key", "group", "is_secret", "value"]

    def get_readonly_fields(self, request, obj=None):
        if obj and obj.is_secret:
            return ["masked_value"]
        return []

    def masked_value(self, obj):
        return "•••• (edit via the API's PATCH endpoint — never shown in plaintext here)"
    masked_value.short_description = "Value"
