from django.contrib import admin

from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ["title", "start_at", "end_at", "audience"]
    list_filter = ["audience", "all_day"]
    search_fields = ["title", "location"]
