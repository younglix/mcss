from django.urls import path

from . import views

urlpatterns = [
    path("config", views.StaffApplicationConfigView.as_view(), name="staff-onboarding-config"),
    path("submit", views.StaffApplicationSubmitView.as_view(), name="staff-onboarding-submit"),
    path("", views.StaffApplicationsListView.as_view(), name="staff-onboarding-list"),
    path("<uuid:application_id>", views.StaffApplicationDetailView.as_view(), name="staff-onboarding-detail"),
    path("<uuid:application_id>/review", views.StaffApplicationReviewView.as_view(), name="staff-onboarding-review"),
    path("<uuid:application_id>/approve", views.StaffApplicationApproveView.as_view(), name="staff-onboarding-approve"),
]
