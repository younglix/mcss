from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "body", "category", "data", "is_read", "read_at", "created_at"]
        read_only_fields = fields


class BroadcastSerializer(serializers.Serializer):
    AUDIENCE_CHOICES = ["all", "staff", "student", "parent", "applicant"]

    title = serializers.CharField(max_length=200)
    body = serializers.CharField()
    audience = serializers.ChoiceField(choices=AUDIENCE_CHOICES)
