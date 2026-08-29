from decimal import Decimal

from .models import Discount, Invoice, Scholarship


def apply_scholarship_allocation(allocation, applied_by=None):
    """Discounts every one of the allocation's student's not-yet-settled
    invoices in that session — the actual effect of granting a scholarship.
    Idempotent per invoice (a Discount already linked to this allocation is
    never duplicated), so re-calling this after new invoices appear for the
    same student/session only touches the new ones."""
    scholarship = allocation.scholarship
    invoices = Invoice.objects.filter(
        student=allocation.student, session=allocation.session,
    ).exclude(status__in=[Invoice.Status.PAID, Invoice.Status.WAIVED])

    created = 0
    for invoice in invoices:
        if Discount.objects.filter(invoice=invoice, scholarship_allocation=allocation).exists():
            continue
        if scholarship.coverage_type == Scholarship.CoverageType.PERCENTAGE:
            amount = (invoice.amount * scholarship.coverage_value / Decimal("100")).quantize(Decimal("0.01"))
        else:
            amount = scholarship.coverage_value
        amount = min(amount, invoice.amount)
        Discount.objects.create(
            invoice=invoice, amount=amount, reason=f"Scholarship: {scholarship.name}",
            scholarship_allocation=allocation, applied_by=applied_by,
        )
        invoice.refresh_status()
        created += 1
    return created
