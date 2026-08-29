from django.urls import path

from . import views

urlpatterns = [
    # HR
    path("hr/leave-requests", views.LeaveRequestsView.as_view(), name="ops-leave-requests"),
    path("hr/leave-requests/<uuid:leave_id>", views.LeaveRequestDetailView.as_view(), name="ops-leave-request-detail"),
    path("hr/leave-requests/<uuid:leave_id>/review", views.LeaveRequestReviewView.as_view(), name="ops-leave-request-review"),
    path("hr/documents", views.StaffDocumentsView.as_view(), name="ops-staff-documents"),
    path("hr/documents/<uuid:document_id>", views.StaffDocumentDetailView.as_view(), name="ops-staff-document-detail"),
    path("hr/upload", views.HRFileUploadView.as_view(), name="ops-hr-upload"),
    path("hr/dashboard", views.HRDashboardView.as_view(), name="ops-hr-dashboard"),
    path("hr/reports", views.HRReportsView.as_view(), name="ops-hr-reports"),

    # Staff Attendance
    path("hr/attendance", views.StaffAttendanceView.as_view(), name="ops-staff-attendance"),
    path("hr/attendance/<uuid:record_id>", views.StaffAttendanceDetailView.as_view(), name="ops-staff-attendance-detail"),

    # Contracts
    path("hr/contracts", views.StaffContractsView.as_view(), name="ops-staff-contracts"),
    path("hr/contracts/<uuid:contract_id>", views.StaffContractDetailView.as_view(), name="ops-staff-contract-detail"),

    # Performance
    path("hr/performance", views.PerformanceReviewsView.as_view(), name="ops-performance-reviews"),
    path("hr/performance/<uuid:review_id>", views.PerformanceReviewDetailView.as_view(), name="ops-performance-review-detail"),

    # Recruitment
    path("recruitment/postings", views.JobPostingsView.as_view(), name="ops-job-postings"),
    path("recruitment/postings/<uuid:posting_id>", views.JobPostingDetailView.as_view(), name="ops-job-posting-detail"),
    path("recruitment/postings/<uuid:posting_id>/applications", views.JobApplicationsView.as_view(), name="ops-job-applications"),
    path("recruitment/applications/<uuid:application_id>", views.JobApplicationDetailView.as_view(), name="ops-job-application-detail"),

    # Inventory
    path("inventory/items", views.InventoryItemsView.as_view(), name="ops-inventory-items"),
    path("inventory/items/<uuid:item_id>", views.InventoryItemDetailView.as_view(), name="ops-inventory-item-detail"),
    path("inventory/items/<uuid:item_id>/transactions", views.InventoryTransactionsView.as_view(), name="ops-inventory-transactions"),

    # Assets
    path("assets", views.AssetsView.as_view(), name="ops-assets"),
    path("assets/<uuid:asset_id>", views.AssetDetailView.as_view(), name="ops-asset-detail"),
]
