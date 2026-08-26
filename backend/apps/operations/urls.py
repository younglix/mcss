from django.urls import path

from . import views

urlpatterns = [
    # HR
    path("hr/leave-requests", views.LeaveRequestsView.as_view(), name="ops-leave-requests"),
    path("hr/leave-requests/<uuid:leave_id>", views.LeaveRequestDetailView.as_view(), name="ops-leave-request-detail"),
    path("hr/leave-requests/<uuid:leave_id>/review", views.LeaveRequestReviewView.as_view(), name="ops-leave-request-review"),
    path("hr/documents", views.StaffDocumentsView.as_view(), name="ops-staff-documents"),
    path("hr/documents/<uuid:document_id>", views.StaffDocumentDetailView.as_view(), name="ops-staff-document-detail"),

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
