from django.urls import path

from . import views

urlpatterns = [
    path("fee-structures", views.FeeStructuresView.as_view(), name="finance-fee-structures"),
    path("fee-structures/<uuid:structure_id>", views.FeeStructureDetailView.as_view(), name="finance-fee-structure-detail"),

    path("school-fees/summary", views.SchoolFeesSummaryView.as_view(), name="finance-school-fees-summary"),
    path("school-fees/generate", views.SchoolFeesGenerateView.as_view(), name="finance-school-fees-generate"),

    path("invoices", views.InvoicesView.as_view(), name="finance-invoices"),
    path("invoices/<uuid:invoice_id>", views.InvoiceDetailView.as_view(), name="finance-invoice-detail"),
    path("invoices/<uuid:invoice_id>/waive", views.InvoiceWaiveView.as_view(), name="finance-invoice-waive"),

    path("payments", views.PaymentsView.as_view(), name="finance-payments"),
    path("payments/<uuid:payment_id>/refund", views.PaymentRefundView.as_view(), name="finance-payment-refund"),

    path("expenses", views.ExpensesView.as_view(), name="finance-expenses"),
    path("expenses/<uuid:expense_id>", views.ExpenseDetailView.as_view(), name="finance-expense-detail"),

    path("salaries", views.StaffSalariesView.as_view(), name="finance-salaries"),
    path("salaries/<uuid:salary_id>", views.StaffSalaryDetailView.as_view(), name="finance-salary-detail"),

    path("payroll/runs", views.PayrollRunsView.as_view(), name="finance-payroll-runs"),
    path("payroll/runs/<uuid:run_id>", views.PayrollRunDetailView.as_view(), name="finance-payroll-run-detail"),
    path("payroll/runs/<uuid:run_id>/generate", views.PayrollRunGenerateView.as_view(), name="finance-payroll-run-generate"),
    path("payroll/runs/<uuid:run_id>/approve", views.PayrollRunApproveView.as_view(), name="finance-payroll-run-approve"),

    path("reports", views.FinancialReportsView.as_view(), name="finance-reports"),
]
