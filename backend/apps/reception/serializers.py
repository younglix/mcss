from rest_framework import serializers

from .models import VisitorLog


class VisitorLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitorLog
        fields = [
            "id", "full_name", "phone", "purpose", "person_to_see",
            "status", "checked_in_at", "checked_out_at", "notes",
        ]
        read_only_fields = ["id", "status", "checked_in_at", "checked_out_at"]
