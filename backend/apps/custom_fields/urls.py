from django.urls import path

from . import views

urlpatterns = [
    path("attachments/upload", views.CustomFieldAttachmentUploadView.as_view(), name="custom-fields-attachment-upload"),
    path("values", views.CustomFieldValuesView.as_view(), name="custom-fields-values"),
    path("values/bulk", views.CustomFieldValuesBulkUpsertView.as_view(), name="custom-fields-values-bulk"),
    path("my-values", views.MyProfileFieldsView.as_view(), name="custom-fields-my-values"),
    path("completeness", views.ProfileCompletenessView.as_view(), name="custom-fields-completeness"),
    path("groups", views.CustomFieldGroupsView.as_view(), name="custom-field-groups-list"),
    path("groups/<uuid:group_id>", views.CustomFieldGroupDetailView.as_view(), name="custom-field-groups-detail"),
    path("", views.CustomFieldsView.as_view(), name="custom-fields-list"),
    path("<uuid:field_id>", views.CustomFieldDetailView.as_view(), name="custom-fields-detail"),
]
