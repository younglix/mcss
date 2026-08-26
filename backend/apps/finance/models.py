from django.db import models
from django.utils import timezone
from django.utils.crypto import get_random_string

from common.models import BaseModel


class FeeStructure(BaseModel):
    """A fee template — how much a category costs for a class, in a given
    session/term. School Fees uses these to bulk-generate real Invoices."""

    category = models.ForeignKey("configuration.FeeCategory", on_delete=models.CASCADE, related_name="fee_structures")
    school_class = models.ForeignKey(
        "configuration.SchoolClass", on_delete=models.CASCADE, null=True, blank=True,
        related_name="fee_structures", help_text="Blank applies to every class.",
    )
    session = models.ForeignKey("configuration.AcademicSession", on_delete=models.CASCADE, related_name="fee_structures")
    term = models.ForeignKey(
        "configuration.Term", on_delete=models.CASCADE, null=True, blank=True,
        related_name="fee_structures", help_text="Blank applies to the whole session.",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta(BaseModel.Meta):
        unique_together = ("category", "school_class", "session", "term")
        ordering = ["-created_at"]

    def __str__(self):
        scope = self.school_class.name if self.school_class else "All classes"
        return f"{self.category.name} — {scope} ({self.session.name})"


class Invoice(BaseModel):
    class Status(models.TextChoices):
        UNPAID = "unpaid", "Unpaid"
        PARTIAL = "partial", "Partially Paid"
        PAID = "paid", "Paid"
        WAIVED = "waived", "Waived"

    student = models.ForeignKey("academics.Student", on_delete=models.CASCADE, related_name="invoices")
    fee_structure = models.ForeignKey(
        FeeStructure, on_delete=models.SET_NULL, null=True, blank=True, related_name="invoices",
    )
    description = models.CharField(max_length=200)
    session = models.ForeignKey("configuration.AcademicSession", on_delete=models.CASCADE, related_name="invoices")
    term = models.ForeignKey("configuration.Term", on_delete=models.CASCADE, null=True, blank=True, related_name="invoices")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.UNPAID)

    class Meta(BaseModel.Meta):
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.description} — {self.student}"

    @property
    def amount_paid(self):
        total = self.payments.filter(status=Payment.Status.COMPLETED).aggregate(total=models.Sum("amount"))["total"]
        return total or 0

    @property
    def balance(self):
        return self.amount - self.amount_paid

    def refresh_status(self):
        paid = self.amount_paid
        if self.status == self.Status.WAIVED:
            pass
        elif paid <= 0:
            self.status = self.Status.UNPAID
        elif paid < self.amount:
            self.status = self.Status.PARTIAL
        else:
            self.status = self.Status.PAID
        self.save(update_fields=["status"])


class Payment(BaseModel):
    class Method(models.TextChoices):
        CASH = "cash", "Cash"
        BANK_TRANSFER = "bank_transfer", "Bank Transfer"
        CARD = "card", "Card"
        ONLINE = "online", "Online"
        CHEQUE = "cheque", "Cheque"

    class Status(models.TextChoices):
        COMPLETED = "completed", "Completed"
        REFUNDED = "refunded", "Refunded"

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=20, choices=Method.choices, default=Method.CASH)
    reference = models.CharField(max_length=100, blank=True)
    receipt_number = models.CharField(max_length=20, unique=True, editable=False)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.COMPLETED)
    paid_at = models.DateTimeField(default=timezone.now)
    recorded_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="payments_recorded")

    class Meta(BaseModel.Meta):
        ordering = ["-paid_at"]

    def __str__(self):
        return f"{self.receipt_number} — {self.amount}"

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            self.receipt_number = f"RCT-{get_random_string(8).upper()}"
        super().save(*args, **kwargs)


class Expense(BaseModel):
    category = models.CharField(max_length=100)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    paid_to = models.CharField(max_length=150, blank=True)
    recorded_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="expenses_recorded")

    class Meta(BaseModel.Meta):
        ordering = ["-date"]

    def __str__(self):
        return f"{self.category} — {self.amount}"


class StaffSalary(BaseModel):
    """The recurring baseline for a staff member's pay — Payroll snapshots
    this into a Payslip each run, so a month's one-off adjustment doesn't
    permanently change next month's default."""

    staff = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="salary")
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta(BaseModel.Meta):
        ordering = ["staff__full_name"]

    def __str__(self):
        return f"{self.staff.full_name} salary"


class PayrollRun(BaseModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        APPROVED = "approved", "Approved"
        PAID = "paid", "Paid"

    month = models.PositiveSmallIntegerField()
    year = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    run_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="payroll_runs")
    approved_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="payroll_runs_approved")
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        unique_together = ("month", "year")
        ordering = ["-year", "-month"]

    def __str__(self):
        return f"Payroll {self.month}/{self.year}"


class Payslip(BaseModel):
    run = models.ForeignKey(PayrollRun, on_delete=models.CASCADE, related_name="payslips")
    staff = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="payslips")
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_pay = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta(BaseModel.Meta):
        unique_together = ("run", "staff")
        ordering = ["staff__full_name"]

    def __str__(self):
        return f"{self.staff.full_name} — {self.run}"
