from rest_framework import serializers

from .models import (
    Asset,
    InventoryItem,
    InventoryTransaction,
    JobApplication,
    JobPosting,
    LeaveRequest,
    StaffDocument,
)


# ---------------------------------------------------------------- HR
class LeaveRequestSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source="staff.full_name", read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.full_name", read_only=True, default=None)

    class Meta:
        model = LeaveRequest
        fields = [
            "id", "staff", "staff_name", "leave_type", "start_date", "end_date", "reason",
            "status", "reviewed_by", "reviewed_by_name", "reviewed_at",
        ]
        read_only_fields = ["id", "status", "reviewed_by", "reviewed_at"]

    def validate(self, attrs):
        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and end < start:
            raise serializers.ValidationError({"end_date": "End date cannot be before the start date."})
        return attrs


class StaffDocumentSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source="staff.full_name", read_only=True)
    uploaded_by_name = serializers.CharField(source="uploaded_by.full_name", read_only=True, default=None)

    class Meta:
        model = StaffDocument
        fields = ["id", "staff", "staff_name", "title", "file_url", "category", "uploaded_by", "uploaded_by_name", "uploaded_at"]
        read_only_fields = ["id", "uploaded_by", "uploaded_at"]


# ---------------------------------------------------------------- Recruitment
class JobPostingSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True, default=None)
    application_count = serializers.SerializerMethodField()

    class Meta:
        model = JobPosting
        fields = ["id", "title", "department", "department_name", "description", "status", "posted_at", "closing_date", "application_count"]
        read_only_fields = ["id", "posted_at"]

    def get_application_count(self, obj):
        return obj.applications.count()


class JobApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = ["id", "posting", "applicant_name", "email", "phone", "resume_url", "status", "applied_at"]
        read_only_fields = ["id", "posting", "applied_at"]


# ---------------------------------------------------------------- Inventory
class InventoryItemSerializer(serializers.ModelSerializer):
    low_stock = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem
        fields = ["id", "name", "category", "quantity", "unit", "reorder_level", "location", "low_stock"]
        read_only_fields = ["id"]

    def get_low_stock(self, obj):
        return obj.quantity <= obj.reorder_level


class InventoryTransactionSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source="recorded_by.full_name", read_only=True, default=None)

    class Meta:
        model = InventoryTransaction
        fields = ["id", "item", "transaction_type", "quantity", "date", "notes", "recorded_by", "recorded_by_name"]
        read_only_fields = ["id", "item", "date", "recorded_by"]


# ---------------------------------------------------------------- Assets
class AssetSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source="assigned_to.full_name", read_only=True, default=None)

    class Meta:
        model = Asset
        fields = [
            "id", "name", "category", "serial_number", "purchase_date", "value",
            "condition", "location", "assigned_to", "assigned_to_name",
        ]
        read_only_fields = ["id"]
