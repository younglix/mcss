from rest_framework import serializers

from .models import CustomField, CustomFieldValue


class CustomFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomField
        fields = ["id", "entity", "key", "label", "field_type", "options", "required", "order", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_options(self, value):
        if value and not isinstance(value, list):
            raise serializers.ValidationError("Options must be a list of strings.")
        return value


class CustomFieldValueSerializer(serializers.ModelSerializer):
    field_key = serializers.CharField(source="field.key", read_only=True)
    field_label = serializers.CharField(source="field.label", read_only=True)
    field_type = serializers.CharField(source="field.field_type", read_only=True)

    class Meta:
        model = CustomFieldValue
        fields = ["field", "field_key", "field_label", "field_type", "value"]


class CustomFieldValueItemSerializer(serializers.Serializer):
    field_id = serializers.UUIDField()
    value = serializers.JSONField(required=False, allow_null=True)


class CustomFieldValueBulkUpsertSerializer(serializers.Serializer):
    entity = serializers.ChoiceField(choices=CustomField.Entity.choices)
    entity_id = serializers.UUIDField()
    values = CustomFieldValueItemSerializer(many=True)
