from django.urls import path

from . import views

urlpatterns = [
    path("public-branding", views.PublicBrandingView.as_view(), name="settings-public-branding"),
    path("public-website-content", views.PublicWebsiteContentView.as_view(), name="settings-public-website-content"),
    path("upload-image", views.AssetUploadView.as_view(), name="settings-upload-image"),
    path("", views.SettingsListView.as_view(), name="settings-list"),
    path("bulk", views.SettingsBulkUpdateView.as_view(), name="settings-bulk"),
    path("<str:key>", views.SettingDetailView.as_view(), name="settings-detail"),
]
