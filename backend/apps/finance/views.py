from django.contrib.auth import get_user_model
from django.db.models import Q, Sum
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView
from xhtml2pdf import pisa

from apps.academics.models import Student
from apps.audit.services import log
from apps.configuration.models import AcademicSession, SchoolProfile
from apps.rbac.permissions import HasPermission
from apps.settings_app.models import SystemSetting
from common.responses import success

from .models import Expense, FeeStructure, Invoice, Payment, PayrollRun, Payslip, StaffSalary
from .serializers import (
    ExpenseSerializer,
    FeeStructureSerializer,
    InvoiceSerializer,
    PaymentSerializer,
    PayrollRunSerializer,
    SchoolFeesGenerateSerializer,
    StaffSalarySerializer,
)

User = get_user_model()


def _permission_mixin(module):
    class Mixin:
        write_action = "edit"

        def get_permissions(self):
            code = f"{module}.view" if self.request.method in ("GET", "HEAD", "OPTIONS") else f"{module}.{self.write_action}"
            return [HasPermission(code)]

    return Mixin


FeesPermissionMixin = _permission_mixin("fees")
ExpensesPermissionMixin = _permission_mixin("expenses")
PayrollPermissionMixin = _permission_mixin("payroll")
ReportsPermissionMixin = _permission_mixin("reports")


# ---------------------------------------------------------------- Fee Structures
class FeeStructuresView(FeesPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = FeeStructureSerializer
    queryset = FeeStructure.objects.select_related("category", "school_class", "session", "term")

    def perform_create(self, serializer):
        structure = serializer.save()
        log(actor=self.request.user, action="finance.fee_structure_created", target=structure, request=self.request)


class FeeStructureDetailView(FeesPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = FeeStructureSerializer
    queryset = FeeStructure.objects.all()
    lookup_url_kwarg = "structure_id"

    def perform_update(self, serializer):
        structure = serializer.save()
        log(actor=self.request.user, action="finance.fee_structure_updated", target=structure, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="finance.fee_structure_deleted", target=instance, request=self.request)
        instance.delete()


# ---------------------------------------------------------------- School Fees
class SchoolFeesSummaryView(FeesPermissionMixin, APIView):
    """Per-student invoiced/paid/balance for a class — the School Fees ledger."""

    def get(self, request):
        class_arm_id = request.query_params.get("class_arm")
        if not class_arm_id:
            return success(data=[])
        students = Student.objects.filter(class_arm_id=class_arm_id, status=Student.Status.ACTIVE).select_related("user")
        rows = []
        for student in students:
            invoices = Invoice.objects.filter(student=student)
            total_invoiced = invoices.aggregate(total=Sum("amount"))["total"] or 0
            total_paid = sum((inv.amount_paid for inv in invoices), start=0)
            rows.append({
                "student": str(student.id),
                "student_name": student.user.full_name,
                "total_invoiced": total_invoiced,
                "total_paid": total_paid,
                "balance": total_invoiced - total_paid,
            })
        return success(data=rows)


class SchoolFeesGenerateView(FeesPermissionMixin, APIView):
    write_action = "create"

    def post(self, request):
        serializer = SchoolFeesGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        school_class = v["school_class"]
        session = v["session"]
        term = v.get("term")

        structures = FeeStructure.objects.filter(session=session).filter(
            Q(school_class=school_class) | Q(school_class__isnull=True)
        )
        if term:
            structures = structures.filter(Q(term=term) | Q(term__isnull=True))
        if not structures.exists():
            raise ValidationError("No fee structures apply to this class/session/term yet.")

        students = Student.objects.filter(
            class_arm__school_class=school_class, status=Student.Status.ACTIVE,
        )
        created = 0
        for student in students:
            for structure in structures:
                _, was_created = Invoice.objects.get_or_create(
                    student=student, fee_structure=structure, session=session, term=term,
                    defaults={
                        "description": f"{structure.category.name} — {session.name}",
                        "amount": structure.amount,
                    },
                )
                if was_created:
                    created += 1
        log(actor=request.user, action="finance.invoices_generated",
            changes={"school_class": str(school_class), "session": str(session), "count": created}, request=request)
        return success(message=f"Generated {created} invoice(s).", data={"count": created})


# ---------------------------------------------------------------- Invoices
class InvoicesView(FeesPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        qs = Invoice.objects.select_related("student__user", "student__class_arm")
        student = self.request.query_params.get("student")
        status_param = self.request.query_params.get("status")
        if student:
            qs = qs.filter(student_id=student)
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    def perform_create(self, serializer):
        invoice = serializer.save()
        log(actor=self.request.user, action="finance.invoice_created", target=invoice, request=self.request)


class InvoiceDetailView(FeesPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = InvoiceSerializer
    queryset = Invoice.objects.select_related("student__user")
    lookup_url_kwarg = "invoice_id"

    def perform_update(self, serializer):
        invoice = serializer.save()
        log(actor=self.request.user, action="finance.invoice_updated", target=invoice, request=self.request)

    def perform_destroy(self, instance):
        if instance.payments.exists():
            raise ValidationError("Can't delete an invoice that already has payments recorded against it.")
        log(actor=self.request.user, action="finance.invoice_deleted", target=instance, request=self.request)
        instance.delete()


class InvoiceWaiveView(APIView):
    permission_classes = [HasPermission("fees.waive")]

    def post(self, request, invoice_id):
        invoice = get_object_or_404(Invoice, id=invoice_id)
        invoice.status = Invoice.Status.WAIVED
        invoice.save(update_fields=["status"])
        log(actor=request.user, action="finance.invoice_waived", target=invoice, request=request)
        return success(message="Invoice waived.", data=InvoiceSerializer(invoice).data)


# ---------------------------------------------------------------- Payments / Receipts
class PaymentsView(APIView):
    def get_permissions(self):
        return [HasPermission("fees.view" if self.request.method == "GET" else "fees.collect")]

    def get(self, request):
        qs = Payment.objects.select_related("invoice__student__user")
        status_param = request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return success(data=PaymentSerializer(qs, many=True).data)

    def post(self, request):
        serializer = PaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save(recorded_by=request.user)
        payment.invoice.refresh_status()
        log(actor=request.user, action="finance.payment_recorded", target=payment, request=request)
        return success(message="Payment recorded.", data=PaymentSerializer(payment).data, status=201)


class PaymentReceiptPDFView(APIView):
    """Proves real, server-rendered PDF generation end-to-end (Documents &
    Templates, Phase 6): renders an HTML letterhead — pulling the school's
    identity from configuration.SchoolProfile and the brand color + the
    invoice-branding toggle from Appearance settings, both already real,
    already-configurable settings — through xhtml2pdf, and streams the
    result directly rather than writing to MEDIA_ROOT (nothing in this repo
    serves media files in production yet, so streaming needs no new infra)."""

    permission_classes = [HasPermission("fees.view")]

    def get(self, request, payment_id):
        payment = get_object_or_404(
            Payment.objects.select_related("invoice__student__user", "invoice__student__class_arm__school_class"),
            id=payment_id,
        )
        profile = SchoolProfile.objects.first()
        settings_by_key = {
            s.key: s.value for s in SystemSetting.objects.filter(key__in=[
                "appearance.primary_color", "appearance.invoice_branding_enabled",
                "general.currency_symbol", "general.currency",
            ])
        }
        student = payment.invoice.student
        contact_parts = [p for p in [profile.phone if profile else "", profile.email if profile else ""] if p]

        # xhtml2pdf's default fonts only cover Latin-1 — a configured symbol
        # outside that range (e.g. "₦") would otherwise render as a missing-
        # glyph box, so fall back to a plain 3-letter code rather than
        # bundling/maintaining a Unicode font just for this one case.
        currency_symbol = settings_by_key.get("general.currency_symbol") or ""
        try:
            currency_symbol.encode("latin-1")
        except UnicodeEncodeError:
            currency_symbol = (settings_by_key.get("general.currency") or "") + " "

        html = render_to_string("finance/receipt.html", {
            "show_branding": bool(settings_by_key.get("appearance.invoice_branding_enabled", True)),
            "logo_url": profile.logo if profile else "",
            "school_name": profile.name if profile else "School",
            "school_address": profile.address if profile else "",
            "school_contact": " · ".join(contact_parts),
            "primary_color": settings_by_key.get("appearance.primary_color") or "#2e004a",
            "currency_symbol": currency_symbol,
            "receipt_number": payment.receipt_number,
            "paid_at": payment.paid_at.strftime("%d %b %Y"),
            "student_name": student.user.full_name,
            "student_class": str(student.class_arm) if student.class_arm else "—",
            "student_identifier": student.user.identifier or "—",
            "invoice_number": payment.invoice.invoice_number,
            "invoice_description": payment.invoice.description,
            "method": payment.get_method_display(),
            "reference": payment.reference or "—",
            "amount": f"{payment.amount:,.2f}",
            "generated_at": timezone.now().strftime("%d %b %Y, %I:%M %p"),
        })

        pdf_buffer = HttpResponse(content_type="application/pdf")
        pdf_buffer["Content-Disposition"] = f'inline; filename="receipt-{payment.receipt_number}.pdf"'
        pisa_status = pisa.CreatePDF(html, dest=pdf_buffer)
        if pisa_status.err:
            return HttpResponse("Could not generate receipt PDF.", status=500)
        return pdf_buffer


class PaymentRefundView(APIView):
    permission_classes = [HasPermission("fees.refund")]

    def post(self, request, payment_id):
        payment = get_object_or_404(Payment, id=payment_id)
        payment.status = Payment.Status.REFUNDED
        payment.save(update_fields=["status"])
        payment.invoice.refresh_status()
        log(actor=request.user, action="finance.payment_refunded", target=payment, request=request)
        return success(message="Payment refunded.", data=PaymentSerializer(payment).data)


# ---------------------------------------------------------------- Expenses
class ExpensesView(ExpensesPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = ExpenseSerializer
    queryset = Expense.objects.all()

    def perform_create(self, serializer):
        expense = serializer.save(recorded_by=self.request.user)
        log(actor=self.request.user, action="finance.expense_recorded", target=expense, request=self.request)


class ExpenseDetailView(ExpensesPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = ExpenseSerializer
    queryset = Expense.objects.all()
    lookup_url_kwarg = "expense_id"

    def perform_update(self, serializer):
        expense = serializer.save()
        log(actor=self.request.user, action="finance.expense_updated", target=expense, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="finance.expense_deleted", target=instance, request=self.request)
        instance.delete()


# ---------------------------------------------------------------- Payroll
class StaffSalariesView(PayrollPermissionMixin, ListCreateAPIView):
    write_action = "run"
    serializer_class = StaffSalarySerializer
    queryset = StaffSalary.objects.select_related("staff")

    def perform_create(self, serializer):
        salary = serializer.save()
        log(actor=self.request.user, action="finance.staff_salary_set", target=salary, request=self.request)


class StaffSalaryDetailView(PayrollPermissionMixin, RetrieveUpdateDestroyAPIView):
    write_action = "run"
    serializer_class = StaffSalarySerializer
    queryset = StaffSalary.objects.all()
    lookup_url_kwarg = "salary_id"

    def perform_update(self, serializer):
        salary = serializer.save()
        log(actor=self.request.user, action="finance.staff_salary_updated", target=salary, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="finance.staff_salary_deleted", target=instance, request=self.request)
        instance.delete()


class PayrollRunsView(PayrollPermissionMixin, ListCreateAPIView):
    write_action = "run"
    serializer_class = PayrollRunSerializer
    queryset = PayrollRun.objects.prefetch_related("payslips__staff")

    def perform_create(self, serializer):
        run = serializer.save(run_by=self.request.user)
        log(actor=self.request.user, action="finance.payroll_run_created", target=run, request=self.request)


class PayrollRunDetailView(PayrollPermissionMixin, APIView):
    def get(self, request, run_id):
        run = get_object_or_404(PayrollRun.objects.prefetch_related("payslips__staff"), id=run_id)
        return success(data=PayrollRunSerializer(run).data)


class PayrollRunGenerateView(APIView):
    permission_classes = [HasPermission("payroll.run")]

    def post(self, request, run_id):
        run = get_object_or_404(PayrollRun, id=run_id)
        if run.status != PayrollRun.Status.DRAFT:
            raise ValidationError("Only a draft run can be (re)generated.")
        count = 0
        for salary in StaffSalary.objects.select_related("staff").filter(staff__is_deleted=False, staff__is_active=True):
            net_pay = salary.basic_salary + salary.allowances - salary.deductions
            Payslip.objects.update_or_create(
                run=run, staff=salary.staff,
                defaults={
                    "basic_salary": salary.basic_salary, "allowances": salary.allowances,
                    "deductions": salary.deductions, "net_pay": net_pay,
                },
            )
            count += 1
        log(actor=request.user, action="finance.payroll_generated", target=run,
            changes={"payslip_count": count}, request=request)
        return success(message=f"Generated {count} payslip(s).", data=PayrollRunSerializer(run).data)


class PayrollRunApproveView(APIView):
    permission_classes = [HasPermission("payroll.approve")]

    def post(self, request, run_id):
        run = get_object_or_404(PayrollRun, id=run_id)
        if run.status != PayrollRun.Status.DRAFT:
            raise ValidationError("Only a draft run can be approved.")
        if not run.payslips.exists():
            raise ValidationError("Generate payslips before approving this run.")
        run.status = PayrollRun.Status.APPROVED
        run.approved_by = request.user
        run.approved_at = timezone.now()
        run.save(update_fields=["status", "approved_by", "approved_at"])
        log(actor=request.user, action="finance.payroll_approved", target=run, request=request)
        return success(message="Payroll run approved.", data=PayrollRunSerializer(run).data)


# ---------------------------------------------------------------- Financial Reports
class FinancialReportsView(ReportsPermissionMixin, APIView):
    def get(self, request):
        session = AcademicSession.objects.filter(is_current=True).first()

        total_invoiced = Invoice.objects.aggregate(total=Sum("amount"))["total"] or 0
        total_collected = Payment.objects.filter(status=Payment.Status.COMPLETED).aggregate(total=Sum("amount"))["total"] or 0
        outstanding = total_invoiced - total_collected

        total_expenses = Expense.objects.aggregate(total=Sum("amount"))["total"] or 0

        collected_by_category = list(
            Payment.objects.filter(status=Payment.Status.COMPLETED)
            .values("invoice__fee_structure__category__name")
            .annotate(total=Sum("amount"))
            .order_by("-total")
        )
        expenses_by_category = list(
            Expense.objects.values("category").annotate(total=Sum("amount")).order_by("-total")
        )

        latest_run = PayrollRun.objects.order_by("-year", "-month").first()
        payroll_total = latest_run.payslips.aggregate(total=Sum("net_pay"))["total"] or 0 if latest_run else 0

        return success(data={
            "session": session.name if session else None,
            "total_invoiced": total_invoiced,
            "total_collected": total_collected,
            "outstanding": outstanding,
            "total_expenses": total_expenses,
            "net_position": total_collected - total_expenses,
            "collected_by_category": [
                {"category": r["invoice__fee_structure__category__name"] or "Uncategorized", "total": r["total"]}
                for r in collected_by_category
            ],
            "expenses_by_category": [{"category": r["category"], "total": r["total"]} for r in expenses_by_category],
            "latest_payroll_run": {
                "id": str(latest_run.id), "month": latest_run.month, "year": latest_run.year,
                "status": latest_run.status, "total_net_pay": payroll_total,
            } if latest_run else None,
        })
