from django.urls import path

from . import views

urlpatterns = [
    path("summary", views.DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("financial", views.DashboardFinancialView.as_view(), name="dashboard-financial"),
    path("academic", views.DashboardAcademicView.as_view(), name="dashboard-academic"),
    path("operations", views.DashboardOperationsView.as_view(), name="dashboard-operations"),
    path("recent-activity", views.DashboardRecentActivityView.as_view(), name="dashboard-recent-activity"),
]
