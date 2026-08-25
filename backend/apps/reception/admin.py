from django.contrib import admin

from .models import VisitorLog


@admin.register(VisitorLog)
class VisitorLogAdmin(admin.ModelAdmin):
    list_display = ["full_name", "purpose", "person_to_see", "status", "checked_in_at", "checked_out_at"]
    list_filter = ["status"]
    search_fields = ["full_name", "phone", "person_to_see"]
