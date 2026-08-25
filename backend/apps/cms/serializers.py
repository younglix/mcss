from rest_framework import serializers

from .models import SiteAnnouncement


class SiteAnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteAnnouncement
        fields = ["id", "title", "body", "is_active", "starts_at", "ends_at", "created_at"]
        read_only_fields = ["id", "created_at"]
