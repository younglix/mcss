from django.db import models

from common.models import BaseModel


# ---------------------------------------------------------------- HR
class LeaveRequest(BaseModel):
    class LeaveType(models.TextChoices):
        ANNUAL = "annual", "Annual"
        SICK = "sick", "Sick"
        MATERNITY = "maternity", "Maternity"
        PATERNITY = "paternity", "Paternity"
        COMPASSIONATE = "compassionate", "Compassionate"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    staff = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="leave_requests")
    leave_type = models.CharField(max_length=20, choices=LeaveType.choices, default=LeaveType.ANNUAL)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    reviewed_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="leave_requests_reviewed"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.staff.full_name} — {self.leave_type} ({self.status})"


class StaffDocument(BaseModel):
    class Category(models.TextChoices):
        CONTRACT = "contract", "Contract"
        CERTIFICATE = "certificate", "Certificate"
        ID = "id", "ID Document"
        OTHER = "other", "Other"

    staff = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="hr_documents")
    title = models.CharField(max_length=200)
    file_url = models.URLField(blank=True)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.OTHER)
    uploaded_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="hr_documents_uploaded"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta(BaseModel.Meta):
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.title} — {self.staff.full_name}"


# ---------------------------------------------------------------- Recruitment
class JobPosting(BaseModel):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        CLOSED = "closed", "Closed"

    title = models.CharField(max_length=150)
    department = models.ForeignKey(
        "configuration.Department", on_delete=models.SET_NULL, null=True, blank=True, related_name="job_postings"
    )
    description = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)
    posted_at = models.DateTimeField(auto_now_add=True)
    closing_date = models.DateField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["-posted_at"]

    def __str__(self):
        return self.title


class JobApplication(BaseModel):
    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        SHORTLISTED = "shortlisted", "Shortlisted"
        REJECTED = "rejected", "Rejected"
        HIRED = "hired", "Hired"

    posting = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name="applications")
    applicant_name = models.CharField(max_length=150)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    resume_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUBMITTED)
    applied_at = models.DateTimeField(auto_now_add=True)

    class Meta(BaseModel.Meta):
        ordering = ["-applied_at"]

    def __str__(self):
        return f"{self.applicant_name} — {self.posting.title}"


# ---------------------------------------------------------------- Inventory
class InventoryItem(BaseModel):
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True)
    quantity = models.IntegerField(default=0)
    unit = models.CharField(max_length=30, blank=True)
    reorder_level = models.IntegerField(default=0)
    location = models.CharField(max_length=150, blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["name"]

    def __str__(self):
        return self.name


class InventoryTransaction(BaseModel):
    class TransactionType(models.TextChoices):
        IN = "in", "Stock In"
        OUT = "out", "Stock Out"

    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name="transactions")
    transaction_type = models.CharField(max_length=10, choices=TransactionType.choices)
    quantity = models.PositiveIntegerField()
    date = models.DateTimeField(auto_now_add=True)
    notes = models.CharField(max_length=255, blank=True)
    recorded_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="inventory_transactions"
    )

    class Meta(BaseModel.Meta):
        ordering = ["-date"]

    def __str__(self):
        return f"{self.item.name} — {self.transaction_type} {self.quantity}"


# ---------------------------------------------------------------- Assets
class Asset(BaseModel):
    class Condition(models.TextChoices):
        NEW = "new", "New"
        GOOD = "good", "Good"
        FAIR = "fair", "Fair"
        POOR = "poor", "Poor"
        DAMAGED = "damaged", "Damaged"

    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    condition = models.CharField(max_length=10, choices=Condition.choices, default=Condition.GOOD)
    location = models.CharField(max_length=150, blank=True)
    assigned_to = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="assets_assigned"
    )

    class Meta(BaseModel.Meta):
        ordering = ["name"]

    def __str__(self):
        return self.name
