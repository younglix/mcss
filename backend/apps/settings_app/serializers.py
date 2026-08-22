from rest_framework import serializers

from .models import SystemSetting

MASK = "••••"


class SystemSettingSerializer(serializers.ModelSerializer):
    value = serializers.JSONField()

    class Meta:
        model = SystemSetting
        fields = ["id", "key", "value", "group", "is_secret", "updated_at"]
        read_only_fields = ["id", "key", "group", "is_secret", "updated_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.is_secret:
            data["value"] = MASK
        return data

    def update(self, instance, validated_data):
        if "value" in validated_data:
            instance.set_value(validated_data["value"])
        instance.save()
        return instance


class SystemSettingBulkItemSerializer(serializers.Serializer):
    key = serializers.CharField()
    value = serializers.JSONField()
