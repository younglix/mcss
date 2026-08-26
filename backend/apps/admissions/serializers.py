from rest_framework import serializers

from .models import Application, ApplicationDocument


class ApplicationDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationDocument
        fields = ["id", "title", "file_url", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


class PublicApplicationSubmitSerializer(serializers.ModelSerializer):
    """What an applicant fills in — status/reference/review fields are all
    server-controlled, never client input."""

    class Meta:
        model = Application
        fields = [
            "id", "reference_number", "full_name", "date_of_birth", "gender", "email", "phone",
            "address", "guardian_name", "guardian_phone", "guardian_email", "class_applying_for",
            "previous_school",
        ]
        read_only_fields = ["id", "reference_number"]

    def validate(self, attrs):
        if not attrs.get("email") and not attrs.get("phone"):
            raise serializers.ValidationError("Provide at least an email or phone number so we can reach you.")
        return attrs


class PublicApplicationStatusSerializer(serializers.ModelSerializer):
    class_applying_for_name = serializers.CharField(source="class_applying_for.name", read_only=True, default=None)

    class Meta:
        model = Application
        fields = ["reference_number", "full_name", "class_applying_for_name", "status", "submitted_at"]
        read_only_fields = fields


class ApplicationSerializer(serializers.ModelSerializer):
    """Full record for Super Admin review."""

    class_applying_for_name = serializers.CharField(source="class_applying_for.name", read_only=True, default=None)
    reviewed_by_name = serializers.CharField(source="reviewed_by.full_name", read_only=True, default=None)
    documents = ApplicationDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Application
        fields = [
            "id", "reference_number", "full_name", "date_of_birth", "gender", "email", "phone", "address",
            "guardian_name", "guardian_phone", "guardian_email", "class_applying_for", "class_applying_for_name",
            "previous_school", "status", "submitted_at", "reviewed_by", "reviewed_by_name", "reviewed_at",
            "review_notes", "documents",
        ]
        read_only_fields = [
            "id", "reference_number", "submitted_at", "reviewed_by", "reviewed_by_name", "reviewed_at", "documents",
        ]


class ApplicationReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[Application.Status.ACCEPTED, Application.Status.REJECTED, Application.Status.UNDER_REVIEW])
    review_notes = serializers.CharField(required=False, allow_blank=True)
