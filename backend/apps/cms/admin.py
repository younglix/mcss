from django.contrib import admin

from .models import SiteAnnouncement


@admin.register(SiteAnnouncement)
class SiteAnnouncementAdmin(admin.ModelAdmin):
    list_display = ["title", "is_active", "starts_at", "ends_at", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["title"]
