from django.urls import path

from . import views

urlpatterns = [
    path("", views.SettingsListView.as_view(), name="settings-list"),
    path("bulk", views.SettingsBulkUpdateView.as_view(), name="settings-bulk"),
    path("<str:key>", views.SettingDetailView.as_view(), name="settings-detail"),
]
