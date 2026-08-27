from django.urls import path

from . import views

urlpatterns = [
    # Public
    path("apply/config", views.ApplicationConfigView.as_view(), name="admissions-apply-config"),
    path("apply", views.ApplicationSubmitView.as_view(), name="admissions-apply"),
    path("apply/<path:reference_number>/documents", views.ApplicationDocumentsView.as_view(), name="admissions-apply-documents"),
    path("status/<path:reference_number>", views.ApplicationStatusView.as_view(), name="admissions-status"),

    # Super Admin review
    path("applications", views.ApplicationsListView.as_view(), name="admissions-applications"),
    path("applications/<uuid:application_id>", views.ApplicationDetailView.as_view(), name="admissions-application-detail"),
    path("applications/<uuid:application_id>/review", views.ApplicationReviewView.as_view(), name="admissions-application-review"),
    path("applications/<uuid:application_id>/accept", views.ApplicationAcceptView.as_view(), name="admissions-application-accept"),
]
