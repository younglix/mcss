from django.db import models

from common.models import BaseModel


# ---------------------------------------------------------------- Library
class Book(BaseModel):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=200, blank=True)
    isbn = models.CharField(max_length=30, blank=True)
    category = models.CharField(max_length=100, blank=True)
    total_copies = models.PositiveIntegerField(default=1)
    available_copies = models.PositiveIntegerField(default=1)

    class Meta(BaseModel.Meta):
        ordering = ["title"]

    def __str__(self):
        return self.title


class BookLoan(BaseModel):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="loans")
    borrower = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="book_loans")
    borrowed_at = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    returned_at = models.DateField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["-borrowed_at"]

    def __str__(self):
        return f"{self.book.title} — {self.borrower.full_name}"


# ---------------------------------------------------------------- Hostel
class HostelBlock(BaseModel):
    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        MIXED = "mixed", "Mixed"

    name = models.CharField(max_length=100, unique=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, default=Gender.MIXED)

    class Meta(BaseModel.Meta):
        ordering = ["name"]

    def __str__(self):
        return self.name


class HostelRoom(BaseModel):
    block = models.ForeignKey(HostelBlock, on_delete=models.CASCADE, related_name="rooms")
    room_number = models.CharField(max_length=20)
    capacity = models.PositiveIntegerField(default=4)

    class Meta(BaseModel.Meta):
        unique_together = ("block", "room_number")
        ordering = ["block__name", "room_number"]

    def __str__(self):
        return f"{self.block.name} — {self.room_number}"


class HostelAllocation(BaseModel):
    student = models.ForeignKey("academics.Student", on_delete=models.CASCADE, related_name="hostel_allocations")
    room = models.ForeignKey(HostelRoom, on_delete=models.CASCADE, related_name="allocations")
    session = models.ForeignKey("configuration.AcademicSession", on_delete=models.CASCADE, related_name="hostel_allocations")
    allocated_at = models.DateField(auto_now_add=True)
    vacated_at = models.DateField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["-allocated_at"]

    def __str__(self):
        return f"{self.student} — {self.room}"


# ---------------------------------------------------------------- Transport
class TransportRoute(BaseModel):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["name"]

    def __str__(self):
        return self.name


class Vehicle(BaseModel):
    plate_number = models.CharField(max_length=20, unique=True)
    capacity = models.PositiveIntegerField(default=20)
    driver_name = models.CharField(max_length=150, blank=True)
    driver_phone = models.CharField(max_length=20, blank=True)
    route = models.ForeignKey(TransportRoute, on_delete=models.SET_NULL, null=True, blank=True, related_name="vehicles")

    class Meta(BaseModel.Meta):
        ordering = ["plate_number"]

    def __str__(self):
        return self.plate_number


class TransportAssignment(BaseModel):
    student = models.ForeignKey("academics.Student", on_delete=models.CASCADE, related_name="transport_assignments")
    route = models.ForeignKey(TransportRoute, on_delete=models.CASCADE, related_name="assignments")
    pickup_point = models.CharField(max_length=150, blank=True)
    assigned_at = models.DateField(auto_now_add=True)

    class Meta(BaseModel.Meta):
        ordering = ["-assigned_at"]

    def __str__(self):
        return f"{self.student} — {self.route.name}"


# ---------------------------------------------------------------- Meals / Mess
class MealMenu(BaseModel):
    class Day(models.TextChoices):
        MONDAY = "monday", "Monday"
        TUESDAY = "tuesday", "Tuesday"
        WEDNESDAY = "wednesday", "Wednesday"
        THURSDAY = "thursday", "Thursday"
        FRIDAY = "friday", "Friday"
        SATURDAY = "saturday", "Saturday"
        SUNDAY = "sunday", "Sunday"

    class MealType(models.TextChoices):
        BREAKFAST = "breakfast", "Breakfast"
        LUNCH = "lunch", "Lunch"
        DINNER = "dinner", "Dinner"
        SNACK = "snack", "Snack"

    day_of_week = models.CharField(max_length=10, choices=Day.choices)
    meal_type = models.CharField(max_length=10, choices=MealType.choices)
    description = models.TextField()

    class Meta(BaseModel.Meta):
        unique_together = ("day_of_week", "meal_type")
        ordering = ["day_of_week", "meal_type"]

    def __str__(self):
        return f"{self.get_day_of_week_display()} {self.get_meal_type_display()}"


# ---------------------------------------------------------------- Activities
class Activity(BaseModel):
    class Category(models.TextChoices):
        CLUB = "club", "Club"
        SPORT = "sport", "Sport"
        SOCIETY = "society", "Society"
        OTHER = "other", "Other"

    name = models.CharField(max_length=150, unique=True)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.OTHER)
    description = models.TextField(blank=True)
    supervisor = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="activities_supervised"
    )

    class Meta(BaseModel.Meta):
        ordering = ["name"]

    def __str__(self):
        return self.name


class ActivityParticipant(BaseModel):
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name="participants")
    student = models.ForeignKey("academics.Student", on_delete=models.CASCADE, related_name="activities")
    joined_at = models.DateField(auto_now_add=True)

    class Meta(BaseModel.Meta):
        unique_together = ("activity", "student")
        ordering = ["-joined_at"]

    def __str__(self):
        return f"{self.student} — {self.activity.name}"


# ---------------------------------------------------------------- Student Resources
class StudentResource(BaseModel):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    # CharField, not URLField: local-disk storage (dev, or prod without S3
    # keys yet) returns a relative /media/... path, which URLField's
    # absolute-URL validator rejects outright — same fix as
    # SchoolProfile.logo/favicon.
    file_url = models.CharField(max_length=500, blank=True)
    category = models.CharField(max_length=100, blank=True)
    class_arm = models.ForeignKey(
        "configuration.ClassArm", on_delete=models.SET_NULL, null=True, blank=True, related_name="resources"
    )
    uploaded_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="resources_uploaded"
    )

    class Meta(BaseModel.Meta):
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


# ---------------------------------------------------------------- Health / Medical Records
class HealthRecord(BaseModel):
    student = models.OneToOneField("academics.Student", on_delete=models.CASCADE, related_name="health_record")
    blood_group = models.CharField(max_length=10, blank=True)
    genotype = models.CharField(max_length=10, blank=True)
    allergies = models.TextField(blank=True)
    conditions = models.TextField(blank=True)
    emergency_contact_name = models.CharField(max_length=150, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)

    class Meta(BaseModel.Meta):
        pass

    def __str__(self):
        return f"Health record — {self.student}"


class HealthIncident(BaseModel):
    student = models.ForeignKey("academics.Student", on_delete=models.CASCADE, related_name="health_incidents")
    date = models.DateField(auto_now_add=True)
    description = models.TextField()
    action_taken = models.TextField(blank=True)
    recorded_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="health_incidents_recorded"
    )

    class Meta(BaseModel.Meta):
        ordering = ["-date"]

    def __str__(self):
        return f"{self.student} — {self.date}"
