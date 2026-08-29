from rest_framework import serializers

from .models import (
    Activity,
    ActivityParticipant,
    Book,
    BookLoan,
    DisciplineRecord,
    HealthIncident,
    HealthRecord,
    HostelAllocation,
    HostelBlock,
    HostelRoom,
    MealMenu,
    StudentResource,
    TransportAssignment,
    TransportRoute,
    Vehicle,
)


# ---------------------------------------------------------------- Library
class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ["id", "title", "author", "isbn", "category", "total_copies", "available_copies"]
        read_only_fields = ["id", "available_copies"]

    def create(self, validated_data):
        validated_data["available_copies"] = validated_data["total_copies"]
        return super().create(validated_data)


class BookLoanSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)
    borrower_name = serializers.CharField(source="borrower.full_name", read_only=True)
    is_returned = serializers.BooleanField(source="returned_at", read_only=True)

    class Meta:
        model = BookLoan
        fields = ["id", "book", "book_title", "borrower", "borrower_name", "borrowed_at", "due_date", "returned_at", "is_returned"]
        read_only_fields = ["id", "borrowed_at", "returned_at"]

    def validate_book(self, book):
        if self.instance is None and book.available_copies < 1:
            raise serializers.ValidationError("No copies of this book are currently available.")
        return book


# ---------------------------------------------------------------- Hostel
class HostelRoomSerializer(serializers.ModelSerializer):
    occupancy = serializers.SerializerMethodField()

    class Meta:
        model = HostelRoom
        fields = ["id", "block", "room_number", "capacity", "occupancy"]
        read_only_fields = ["id", "block"]

    def get_occupancy(self, obj):
        return obj.allocations.filter(vacated_at__isnull=True).count()


class HostelBlockSerializer(serializers.ModelSerializer):
    rooms = HostelRoomSerializer(many=True, read_only=True)

    class Meta:
        model = HostelBlock
        fields = ["id", "name", "gender", "rooms"]


class HostelAllocationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    room_label = serializers.SerializerMethodField()

    class Meta:
        model = HostelAllocation
        fields = ["id", "student", "student_name", "room", "room_label", "session", "allocated_at", "vacated_at"]
        read_only_fields = ["id", "session", "allocated_at"]

    def get_room_label(self, obj):
        return f"{obj.room.block.name} — {obj.room.room_number}"


# ---------------------------------------------------------------- Transport
class TransportRouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportRoute
        fields = ["id", "name", "description", "fee_amount"]


class VehicleSerializer(serializers.ModelSerializer):
    route_name = serializers.CharField(source="route.name", read_only=True, default=None)

    class Meta:
        model = Vehicle
        fields = ["id", "plate_number", "capacity", "driver_name", "driver_phone", "route", "route_name"]


class TransportAssignmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    route_name = serializers.CharField(source="route.name", read_only=True)

    class Meta:
        model = TransportAssignment
        fields = ["id", "student", "student_name", "route", "route_name", "pickup_point", "assigned_at"]
        read_only_fields = ["id", "assigned_at"]


# ---------------------------------------------------------------- Meals / Mess
class MealMenuSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealMenu
        fields = ["id", "day_of_week", "meal_type", "description"]


# ---------------------------------------------------------------- Activities
class ActivitySerializer(serializers.ModelSerializer):
    supervisor_name = serializers.CharField(source="supervisor.full_name", read_only=True, default=None)
    participant_count = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = ["id", "name", "category", "description", "supervisor", "supervisor_name", "participant_count"]
        read_only_fields = ["id"]

    def get_participant_count(self, obj):
        return obj.participants.count()


class ActivityParticipantSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)

    class Meta:
        model = ActivityParticipant
        fields = ["id", "activity", "student", "student_name", "joined_at"]
        read_only_fields = ["id", "activity", "joined_at"]


# ---------------------------------------------------------------- Student Resources
class StudentResourceSerializer(serializers.ModelSerializer):
    class_arm_label = serializers.SerializerMethodField()
    uploaded_by_name = serializers.CharField(source="uploaded_by.full_name", read_only=True, default=None)

    class Meta:
        model = StudentResource
        fields = ["id", "title", "description", "file_url", "category", "class_arm", "class_arm_label", "uploaded_by", "uploaded_by_name", "created_at"]
        read_only_fields = ["id", "uploaded_by", "created_at"]

    def get_class_arm_label(self, obj):
        return str(obj.class_arm) if obj.class_arm else None


# ---------------------------------------------------------------- Health
class HealthRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)

    class Meta:
        model = HealthRecord
        fields = [
            "id", "student", "student_name", "blood_group", "genotype", "allergies", "conditions",
            "emergency_contact_name", "emergency_contact_phone",
        ]
        read_only_fields = ["id", "student"]


class HealthIncidentSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source="recorded_by.full_name", read_only=True, default=None)

    class Meta:
        model = HealthIncident
        fields = ["id", "student", "date", "description", "action_taken", "recorded_by", "recorded_by_name"]
        read_only_fields = ["id", "student", "date", "recorded_by"]


# ---------------------------------------------------------------- Discipline
class DisciplineRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    class_arm_label = serializers.SerializerMethodField()
    recorded_by_name = serializers.CharField(source="recorded_by.full_name", read_only=True, default=None)

    class Meta:
        model = DisciplineRecord
        fields = [
            "id", "student", "student_name", "class_arm_label", "incident_date", "category",
            "description", "action_taken", "severity", "recorded_by", "recorded_by_name", "created_at",
        ]
        read_only_fields = ["id", "recorded_by", "created_at"]

    def get_class_arm_label(self, obj):
        return str(obj.student.class_arm) if obj.student.class_arm else None
