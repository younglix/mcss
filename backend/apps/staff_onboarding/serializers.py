from rest_framework import serializers

from .models import StaffApplication, StaffApplicationSubjectClaim


class _SubjectClaimInputSerializer(serializers.Serializer):
    subject = serializers.UUIDField()
    class_arm = serializers.UUIDField()


class PublicStaffApplicationSubmitSerializer(serializers.ModelSerializer):
    """What a staff member fills in through the public link. staff_type
    drives which other fields are actually required — see validate()."""

    subject_claims = _SubjectClaimInputSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = StaffApplication
        fields = [
            "id", "staff_type", "full_name", "email", "phone", "sex", "date_of_birth",
            "nin", "qualification", "is_form_teacher", "form_teacher_class_arm",
            "non_academic_role_title", "subject_claims",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        if not attrs.get("full_name"):
            raise serializers.ValidationError({"full_name": "Full name is required."})
        if not attrs.get("email") and not attrs.get("phone"):
            raise serializers.ValidationError({"email": "Provide at least an email or phone number so we can reach you."})

        staff_type = attrs.get("staff_type")
        if staff_type == StaffApplication.StaffType.NON_ACADEMIC:
            if not attrs.get("non_academic_role_title"):
                raise serializers.ValidationError({"non_academic_role_title": "Enter your role (e.g. Cleaner, Driver)."})
        else:
            if not attrs.get("nin"):
                raise serializers.ValidationError({"nin": "NIN is required."})
            if not attrs.get("qualification"):
                raise serializers.ValidationError({"qualification": "Qualification is required."})
            if staff_type == StaffApplication.StaffType.TEACHER:
                if not attrs.get("subject_claims"):
                    raise serializers.ValidationError({"subject_claims": "Add at least one subject and class you teach."})
                if attrs.get("is_form_teacher") and not attrs.get("form_teacher_class_arm"):
                    raise serializers.ValidationError({"form_teacher_class_arm": "Select which class-arm you're the form teacher of."})
        return attrs

    def create(self, validated_data):
        claims_data = validated_data.pop("subject_claims", [])
        application = StaffApplication.objects.create(**validated_data)
        for claim in claims_data:
            StaffApplicationSubjectClaim.objects.create(
                application=application, subject_id=claim["subject"], class_arm_id=claim["class_arm"],
            )
        return application


class SubjectClaimSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    class_arm_name = serializers.SerializerMethodField()

    class Meta:
        model = StaffApplicationSubjectClaim
        fields = ["id", "subject", "subject_name", "class_arm", "class_arm_name"]
        read_only_fields = fields

    def get_class_arm_name(self, obj):
        return f"{obj.class_arm.school_class.name} {obj.class_arm.name}"


class StaffApplicationSerializer(serializers.ModelSerializer):
    """Full record for HR/Super Admin review."""

    staff_type_label = serializers.CharField(source="get_staff_type_display", read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.full_name", read_only=True, default=None)
    form_teacher_class_arm_name = serializers.SerializerMethodField()
    subject_claims = SubjectClaimSerializer(many=True, read_only=True)
    created_user_identifier = serializers.CharField(source="created_user.identifier", read_only=True, default=None)

    class Meta:
        model = StaffApplication
        fields = [
            "id", "staff_type", "staff_type_label", "full_name", "email", "phone", "sex", "date_of_birth",
            "nin", "qualification", "is_form_teacher", "form_teacher_class_arm", "form_teacher_class_arm_name",
            "non_academic_role_title", "subject_claims",
            "status", "submitted_at", "reviewed_by", "reviewed_by_name", "reviewed_at", "review_notes",
            "created_user", "created_user_identifier", "created_payout",
        ]
        read_only_fields = [
            "id", "staff_type_label", "reviewed_by_name", "form_teacher_class_arm_name", "subject_claims",
            "status", "submitted_at", "reviewed_by", "reviewed_at",
            "created_user", "created_user_identifier", "created_payout",
        ]

    def get_form_teacher_class_arm_name(self, obj):
        if not obj.form_teacher_class_arm_id:
            return None
        arm = obj.form_teacher_class_arm
        return f"{arm.school_class.name} {arm.name}"


class StaffApplicationReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[StaffApplication.Status.UNDER_REVIEW, StaffApplication.Status.REJECTED])
    review_notes = serializers.CharField(required=False, allow_blank=True)
