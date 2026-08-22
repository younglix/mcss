from django.urls import path

from . import views

urlpatterns = [
    path("logs", views.AuditLogListView.as_view(), name="audit-logs"),
    path("login-history", views.LoginHistoryListView.as_view(), name="audit-login-history"),
]
