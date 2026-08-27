from django.db import models
from django.utils import timezone

from apps.settings_app.numbering import generate_number
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

    class Purpose(models.TextChoices):
        """Blank for ordinary invoices (bulk-generated school fees, optional
        add-ons). The two admission-workflow values mark the auto-generated
        invoices refresh_status() chains off of — a small explicit field
        rather than matching on `description` text, which staff can edit."""
        ACCEPTANCE_FEE = "acceptance_fee", "Acceptance Fee"
        FIRST_SCHOOL_FEE = "first_school_fee", "First School Fee"

    invoice_number = models.CharField(max_length=30, unique=True, editable=False)
    student = models.ForeignKey("academics.Student", on_delete=models.CASCADE, related_name="invoices")
    fee_structure = models.ForeignKey(
        FeeStructure, on_delete=models.SET_NULL, null=True, blank=True, related_name="invoices",
    )
    purpose = models.CharField(max_length=20, choices=Purpose.choices, blank=True, default="")
    description = models.CharField(max_length=200)
    session = models.ForeignKey("configuration.AcademicSession", on_delete=models.CASCADE, related_name="invoices")
    term = models.ForeignKey("configuration.Term", on_delete=models.CASCADE, null=True, blank=True, related_name="invoices")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.UNPAID)

    class Meta(BaseModel.Meta):
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.invoice_number} — {self.student}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = generate_number("invoice")
        super().save(*args, **kwargs)

    @property
    def amount_paid(self):
        total = self.payments.filter(status=Payment.Status.COMPLETED).aggregate(total=models.Sum("amount"))["total"]
        return total or 0

    @property
    def balance(self):
        return self.amount - self.amount_paid

    def refresh_status(self):
        was_paid = self.status == self.Status.PAID
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

        if self.status == self.Status.PAID and not was_paid and self.purpose:
            self._advance_admission_workflow()

    def _advance_admission_workflow(self):
        """Chains the admission-workflow invoices: Acceptance Fee paid ->
        auto-generate the First School Fee invoice(s); First School Fee(s)
        paid -> generate the student's Registration Number. Guarded by
        existence/presence checks (not just the was_paid transition above)
        so this is safe to call more than once for the same invoice."""
        from apps.academics.models import Student

        student = self.student
        if student.status != Student.Status.PENDING:
            return

        if self.purpose == self.Purpose.ACCEPTANCE_FEE:
            _generate_first_school_fee_invoices(student)
        elif self.purpose == self.Purpose.FIRST_SCHOOL_FEE:
            _maybe_generate_registration_number(student)


def _generate_first_school_fee_invoices(student):
    from apps.settings_app.numbering import generate_number

    if student.invoices.filter(purpose=Invoice.Purpose.FIRST_SCHOOL_FEE).exists():
        return  # already generated — idempotent no-op

    application = getattr(student, "source_application", None)
    school_class = application.class_applying_for if application else None
    if school_class is None:
        return  # nothing to bill against; staff can generate manually later

    session = student.invoices.filter(purpose=Invoice.Purpose.ACCEPTANCE_FEE).first().session
    structures = FeeStructure.objects.filter(session=session).filter(
        models.Q(school_class=school_class) | models.Q(school_class__isnull=True)
    )
    for structure in structures:
        Invoice.objects.get_or_create(
            student=student, fee_structure=structure, session=session, term=None,
            purpose=Invoice.Purpose.FIRST_SCHOOL_FEE,
            defaults={"description": f"{structure.category.name} — {session.name}", "amount": structure.amount},
        )


def _maybe_generate_registration_number(student):
    from apps.settings_app.numbering import generate_number

    if student.registration_number:
        return  # already generated — idempotent no-op

    batch = student.invoices.filter(purpose=Invoice.Purpose.FIRST_SCHOOL_FEE)
    if not batch.exists() or batch.exclude(status=Invoice.Status.PAID).exists():
        return  # not all first-school-fee invoices are settled yet

    student.registration_number = generate_number("registration")
    student.save(update_fields=["registration_number"])


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
        constraints = [
            # The idempotency guard for the Paystack webhook: `reference` is
            # the gateway's transaction reference, and a redelivered webhook
            # for one already recorded must be rejected at the DB level too,
            # not just by the application-level existence check.
            models.UniqueConstraint(
                fields=["reference"], condition=~models.Q(reference="") & models.Q(reference__isnull=False),
                name="finance_payment_reference_uniq",
            ),
        ]

    def __str__(self):
        return f"{self.receipt_number} — {self.amount}"

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            self.receipt_number = generate_number("receipt")
        super().save(*args, **kwargs)


class Expense(BaseModel):
    expense_number = models.CharField(max_length=30, unique=True, editable=False)
    category = models.CharField(max_length=100)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    paid_to = models.CharField(max_length=150, blank=True)
    recorded_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="expenses_recorded")

    class Meta(BaseModel.Meta):
        ordering = ["-date"]

    def __str__(self):
        return f"{self.expense_number} — {self.amount}"

    def save(self, *args, **kwargs):
        if not self.expense_number:
            self.expense_number = generate_number("expense")
        super().save(*args, **kwargs)


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
