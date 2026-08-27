from rest_framework import serializers

from .models import Application, ApplicationDocument


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
    server-controlled, never client input."""

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
            "class_applying_for", "previous_school",
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

        return attrs


class PublicApplicationConfigSerializer(serializers.Serializer):
    guardian_required = serializers.BooleanField()


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


class ApplicationSerializer(serializers.ModelSerializer):
    """Full record for Super Admin review."""

    class_applying_for_name = serializers.CharField(source="class_applying_for.name", read_only=True, default=None)
    reviewed_by_name = serializers.CharField(source="reviewed_by.full_name", read_only=True, default=None)
    full_name = serializers.CharField(read_only=True)
    documents = ApplicationDocumentSerializer(many=True, read_only=True)
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
            "class_applying_for", "class_applying_for_name", "previous_school",
            "status", "submitted_at", "reviewed_by", "reviewed_by_name", "reviewed_at",
            "review_notes", "documents", "student_identifier", "registration_number",
        ]
        read_only_fields = [
            "id", "reference_number", "submitted_at", "reviewed_by", "reviewed_by_name", "reviewed_at",
            "documents", "student_identifier", "registration_number",
        ]


class ApplicationReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[Application.Status.UNDER_REVIEW, Application.Status.REJECTED])
    review_notes = serializers.CharField(required=False, allow_blank=True)
