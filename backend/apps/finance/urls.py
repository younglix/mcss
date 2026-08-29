from django.urls import path

from . import views

urlpatterns = [
    path("fee-structures", views.FeeStructuresView.as_view(), name="finance-fee-structures"),
    path("fee-structures/<uuid:structure_id>", views.FeeStructureDetailView.as_view(), name="finance-fee-structure-detail"),

    path("school-fees/summary", views.SchoolFeesSummaryView.as_view(), name="finance-school-fees-summary"),
    path("school-fees/generate", views.SchoolFeesGenerateView.as_view(), name="finance-school-fees-generate"),

    path("invoices", views.InvoicesView.as_view(), name="finance-invoices"),
    path("invoices/mine", views.MyInvoicesView.as_view(), name="finance-my-invoices"),
    path("invoices/child/<uuid:student_id>", views.ChildInvoicesView.as_view(), name="finance-child-invoices"),
    path("invoices/<uuid:invoice_id>", views.InvoiceDetailView.as_view(), name="finance-invoice-detail"),
    path("invoices/<uuid:invoice_id>/waive", views.InvoiceWaiveView.as_view(), name="finance-invoice-waive"),
    path("invoices/<uuid:invoice_id>/pay", views.InvoicePayView.as_view(), name="finance-invoice-pay"),

    path("payments", views.PaymentsView.as_view(), name="finance-payments"),
    path("payments/mine", views.MyPaymentsView.as_view(), name="finance-my-payments"),
    path("payments/child/<uuid:student_id>", views.ChildPaymentsView.as_view(), name="finance-child-payments"),
    path("payments/<uuid:payment_id>/refund", views.PaymentRefundView.as_view(), name="finance-payment-refund"),
    path("payments/<uuid:payment_id>/verify", views.PaymentVerifyView.as_view(), name="finance-payment-verify"),
    path("payments/<uuid:payment_id>/reconcile", views.PaymentReconcileView.as_view(), name="finance-payment-reconcile"),
    path("payments/<uuid:payment_id>/receipt.pdf", views.PaymentReceiptPDFView.as_view(), name="finance-payment-receipt-pdf"),
    path("payments/paystack/webhook", views.PaystackWebhookView.as_view(), name="finance-paystack-webhook"),

    path("expenses", views.ExpensesView.as_view(), name="finance-expenses"),
    path("expenses/<uuid:expense_id>", views.ExpenseDetailView.as_view(), name="finance-expense-detail"),

    path("income", views.IncomeView.as_view(), name="finance-income"),
    path("income/<uuid:income_id>", views.IncomeDetailView.as_view(), name="finance-income-detail"),

    path("discounts", views.DiscountsView.as_view(), name="finance-discounts"),
    path("discounts/<uuid:discount_id>", views.DiscountDetailView.as_view(), name="finance-discount-detail"),

    path("scholarships", views.ScholarshipsView.as_view(), name="finance-scholarships"),
    path("scholarships/<uuid:scholarship_id>", views.ScholarshipDetailView.as_view(), name="finance-scholarship-detail"),
    path("scholarships/allocations", views.ScholarshipAllocationsView.as_view(), name="finance-scholarship-allocations"),
    path("scholarships/allocations/<uuid:allocation_id>", views.ScholarshipAllocationDetailView.as_view(), name="finance-scholarship-allocation-detail"),

    path("outstanding", views.OutstandingFeesView.as_view(), name="finance-outstanding"),
    path("reminders", views.FeeReminderView.as_view(), name="finance-reminders"),

    path("salaries", views.StaffSalariesView.as_view(), name="finance-salaries"),
    path("salaries/<uuid:salary_id>", views.StaffSalaryDetailView.as_view(), name="finance-salary-detail"),

    path("payroll/runs", views.PayrollRunsView.as_view(), name="finance-payroll-runs"),
    path("payroll/runs/<uuid:run_id>", views.PayrollRunDetailView.as_view(), name="finance-payroll-run-detail"),
    path("payroll/runs/<uuid:run_id>/generate", views.PayrollRunGenerateView.as_view(), name="finance-payroll-run-generate"),
    path("payroll/runs/<uuid:run_id>/approve", views.PayrollRunApproveView.as_view(), name="finance-payroll-run-approve"),

    path("reports", views.FinancialReportsView.as_view(), name="finance-reports"),
]
