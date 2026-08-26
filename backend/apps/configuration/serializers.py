from rest_framework import serializers

from .models import (
    AcademicSession,
    ClassArm,
    Department,
    FeeCategory,
    GradeScale,
    SchoolClass,
    SchoolProfile,
    Term,
)


class SchoolProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolProfile
        fields = [
            "id", "name", "short_name", "logo", "favicon", "address", "phone", "email",
            "website", "country", "state", "city", "motto",
        ]


class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = ["id", "session", "name", "start_date", "end_date", "is_current"]
        read_only_fields = ["id", "session", "is_current"]


class AcademicSessionSerializer(serializers.ModelSerializer):
    terms = TermSerializer(many=True, read_only=True)

    class Meta:
        model = AcademicSession
        fields = ["id", "name", "start_date", "end_date", "is_current", "terms"]
        read_only_fields = ["id", "is_current", "terms"]


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name"]


class ClassArmSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassArm
        fields = ["id", "school_class", "name"]
        read_only_fields = ["id", "school_class"]


class SchoolClassSerializer(serializers.ModelSerializer):
    arms = ClassArmSerializer(many=True, read_only=True)

    class Meta:
        model = SchoolClass
        fields = ["id", "name", "level_order", "arms"]
        read_only_fields = ["id", "arms"]


class GradeScaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeScale
        fields = ["id", "name", "min_score", "max_score", "remark", "grade_point"]


class FeeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeCategory
        fields = ["id", "name", "is_recurring"]
