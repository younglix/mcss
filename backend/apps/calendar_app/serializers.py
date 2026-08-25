from rest_framework import serializers

from .models import Event


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ["id", "title", "description", "start_at", "end_at", "all_day", "location", "audience"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        start = attrs.get("start_at", getattr(self.instance, "start_at", None))
        end = attrs.get("end_at", getattr(self.instance, "end_at", None))
        if end and start and end < start:
            raise serializers.ValidationError({"end_at": "End time cannot be before the start time."})
        return attrs
