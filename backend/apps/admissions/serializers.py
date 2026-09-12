from rest_framework import serializers

from apps.custom_fields.models import CustomField
from apps.custom_fields.serializers import CustomFieldValueItemSerializer
from apps.custom_fields.services import mask_if_sensitive, missing_required_fields

from .models import Application, ApplicationDocument, ApplicationFieldValue


class ApplicationDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationDocument
        fields = ["id", "title", "file_url", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


# Fields required on a `secondary` application beyond the always-required
# core (surname/first_name/date_of_birth/gender/class_applying_for/email-or-phone)
# — mirrors the paper form's sections. Not required on `primary` applications,
# since no downstream workflow exists for that level yet.
_SECONDARY_REQUIRED_FIELDS = [
    "present_class", "schools_attended", "religion", "nationality", "state_of_origin",
    "father_name", "father_phone", "mother_name", "mother_phone",
    "address", "guardian_signature_name",
]


class PublicApplicationSubmitSerializer(serializers.ModelSerializer):
    """What an applicant fills in — status/reference/review fields are all
    server-controlled, never client input. `custom_field_values` carries
    every Super-Admin-defined "student" AND "parent" custom field — the
    same dynamic set the ongoing profile-edit screens render — so a field
    added later never needs an admissions-specific code change."""

    custom_field_values = CustomFieldValueItemSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = Application
        fields = [
            "id", "reference_number", "level",
            "surname", "first_name", "middle_name", "date_of_birth", "gender",
            "present_class", "schools_attended", "religion", "religion_other",
            "nationality", "state_of_origin", "email", "phone", "address",
            "has_guardian", "guardian_name", "guardian_phone", "guardian_email",
            "father_name", "father_occupation", "father_phone", "father_place_of_work",
            "father_home_address", "father_office_address", "father_email",
            "mother_name", "mother_occupation", "mother_phone", "mother_place_of_work",
            "mother_home_address", "mother_office_address", "mother_email",
            "siblings_in_school", "guardian_signature_name",
            "class_applying_for", "previous_school", "custom_field_values",
        ]
        read_only_fields = ["id", "reference_number"]

    def validate(self, attrs):
        if not attrs.get("email") and not attrs.get("phone"):
            raise serializers.ValidationError({"email": "Provide at least an email or phone number so we can reach you."})
        if not attrs.get("surname") or not attrs.get("first_name"):
            raise serializers.ValidationError("Surname and first name are required.")

        if attrs.get("level") == Application.Level.SECONDARY:
            missing = [f for f in _SECONDARY_REQUIRED_FIELDS if not attrs.get(f)]
            if not attrs.get("date_of_birth"):
                missing.append("date_of_birth")
            if not attrs.get("gender"):
                missing.append("gender")
            if not attrs.get("class_applying_for"):
                missing.append("class_applying_for")
            if attrs.get("religion") == Application.Religion.OTHERS and not attrs.get("religion_other"):
                missing.append("religion_other")
            if attrs.get("has_guardian", True):
                if not attrs.get("guardian_name"):
                    missing.append("guardian_name")
                if not attrs.get("guardian_phone") and not attrs.get("guardian_email"):
                    missing.append("guardian_phone_or_email")
            if missing:
                raise serializers.ValidationError({"required": f"The following fields are required for a secondary application: {', '.join(missing)}."})

        submitted_by_field_id = {str(v["field_id"]): v.get("value") for v in attrs.get("custom_field_values") or []}
        missing_dynamic = missing_required_fields(CustomField.Entity.STUDENT, submitted_by_field_id)
        # Parent-entity fields only apply when a guardian account will
        # actually be created — has_guardian=False means there's no parent
        # for them to attach to.
        if attrs.get("has_guardian", True):
            missing_dynamic += missing_required_fields(CustomField.Entity.PARENT, submitted_by_field_id)
        if missing_dynamic:
            raise serializers.ValidationError({"custom_field_values": f"These fields are required: {', '.join(missing_dynamic)}."})

        return attrs

    def create(self, validated_data):
        field_values_data = validated_data.pop("custom_field_values", [])
        application = Application.objects.create(**validated_data)
        for item in field_values_data:
            field = CustomField.objects.filter(
                id=item["field_id"], entity__in=[CustomField.Entity.STUDENT, CustomField.Entity.PARENT], is_active=True,
            ).first()
            if not field:
                continue
            ApplicationFieldValue.objects.create(application=application, field=field, value=item.get("value"))
        return application


class PublicApplicationConfigSerializer(serializers.Serializer):
    guardian_required = serializers.BooleanField()
    is_open = serializers.BooleanField()
    reason = serializers.CharField(allow_null=True)
    opens_at = serializers.CharField(allow_null=True)
    closes_at = serializers.CharField(allow_null=True)
    session_name = serializers.CharField(allow_null=True)
    # Every active Super-Admin-defined "student"/"parent" custom field —
    # definitions only (no values; nothing exists to attach a value to yet)
    # — so the public form can render them dynamically. A field added later
    # shows up here with no admissions-specific code change.
    student_custom_fields = serializers.SerializerMethodField()
    parent_custom_fields = serializers.SerializerMethodField()

    def _field_list(self, entity):
        return [
            {
                "field_id": str(f.id), "key": f.key, "label": f.label, "field_type": f.field_type,
                "options": f.options, "required": f.required, "is_sensitive": f.is_sensitive,
            }
            for f in CustomField.objects.filter(entity=entity, is_active=True)
        ]

    def get_student_custom_fields(self, obj):
        return self._field_list(CustomField.Entity.STUDENT)

    def get_parent_custom_fields(self, obj):
        return self._field_list(CustomField.Entity.PARENT)


class PublicApplicationStatusSerializer(serializers.ModelSerializer):
    class_applying_for_name = serializers.CharField(source="class_applying_for.name", read_only=True, default=None)
    full_name = serializers.CharField(read_only=True)
    registration_number = serializers.CharField(source="enrolled_student.registration_number", read_only=True, default=None)
    acceptance_fee = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            "reference_number", "full_name", "level", "class_applying_for_name",
            "status", "submitted_at", "registration_number", "acceptance_fee",
        ]
        read_only_fields = fields

    def get_acceptance_fee(self, obj):
        if not obj.enrolled_student_id:
            return None
        invoice = obj.enrolled_student.invoices.filter(purpose="acceptance_fee").first()
        if not invoice:
            return None
        return {"status": invoice.status, "amount": str(invoice.amount), "balance": str(invoice.balance)}


class ApplicationFieldValueSerializer(serializers.ModelSerializer):
    field_key = serializers.CharField(source="field.key", read_only=True)
    field_label = serializers.CharField(source="field.label", read_only=True)
    field_type = serializers.CharField(source="field.field_type", read_only=True)
    field_entity = serializers.CharField(source="field.entity", read_only=True)
    is_sensitive = serializers.BooleanField(source="field.is_sensitive", read_only=True)
    is_masked = serializers.SerializerMethodField()
    value = serializers.SerializerMethodField()

    class Meta:
        model = ApplicationFieldValue
        fields = ["id", "field", "field_key", "field_label", "field_type", "field_entity", "is_sensitive", "is_masked", "value"]
        read_only_fields = fields

    def get_value(self, obj):
        viewer = self.context.get("request").user if self.context.get("request") else None
        if viewer is None:
            return obj.value
        shown, _ = mask_if_sensitive(obj.field, obj.value, viewer)
        return shown

    def get_is_masked(self, obj):
        viewer = self.context.get("request").user if self.context.get("request") else None
        if viewer is None:
            return False
        _, is_masked = mask_if_sensitive(obj.field, obj.value, viewer)
        return is_masked


class ApplicationSerializer(serializers.ModelSerializer):
    """Full record for Super Admin review."""

    class_applying_for_name = serializers.CharField(source="class_applying_for.name", read_only=True, default=None)
    reviewed_by_name = serializers.CharField(source="reviewed_by.full_name", read_only=True, default=None)
    full_name = serializers.CharField(read_only=True)
    documents = ApplicationDocumentSerializer(many=True, read_only=True)
    field_values = ApplicationFieldValueSerializer(many=True, read_only=True)
    student_identifier = serializers.CharField(source="enrolled_student.user.identifier", read_only=True, default=None)
    registration_number = serializers.CharField(source="enrolled_student.registration_number", read_only=True, default=None)

    class Meta:
        model = Application
        fields = [
            "id", "reference_number", "level", "full_name",
            "surname", "first_name", "middle_name", "date_of_birth", "gender",
            "present_class", "schools_attended", "religion", "religion_other",
            "nationality", "state_of_origin", "email", "phone", "address",
            "has_guardian", "guardian_name", "guardian_phone", "guardian_email",
            "father_name", "father_occupation", "father_phone", "father_place_of_work",
            "father_home_address", "father_office_address", "father_email",
            "mother_name", "mother_occupation", "mother_phone", "mother_place_of_work",
            "mother_home_address", "mother_office_address", "mother_email",
            "siblings_in_school", "guardian_signature_name",
            "class_applying_for", "class_applying_for_name", "previous_school", "field_values",
            "status", "submitted_at", "reviewed_by", "reviewed_by_name", "reviewed_at",
            "review_notes", "documents", "student_identifier", "registration_number",
        ]
        read_only_fields = [
            "id", "reference_number", "submitted_at", "reviewed_by", "reviewed_by_name", "reviewed_at",
            "documents", "field_values", "student_identifier", "registration_number",
        ]


class ApplicationReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[Application.Status.UNDER_REVIEW, Application.Status.REJECTED])
    review_notes = serializers.CharField(required=False, allow_blank=True)
