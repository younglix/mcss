from django.shortcuts import get_object_or_404
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from apps.audit.services import log
from apps.rbac.permissions import HasPermission
from common.responses import failure, success

from .models import CustomField, CustomFieldValue
from .serializers import CustomFieldSerializer, CustomFieldValueBulkUpsertSerializer, CustomFieldValueSerializer


class CustomFieldsPermissionMixin:
    def get_permissions(self):
        code = "custom_fields.view" if self.request.method in ("GET", "HEAD", "OPTIONS") else "custom_fields.edit"
        return [HasPermission(code)]


class PublicApplicationValuesMixin:
    """The admission form is public, so its custom fields (definitions and
    the applicant's own answers) must be readable/writable without auth —
    same trust model the rest of apps.admissions already uses (the
    reference_number/application id itself is the unguessable credential).
    Every other entity keeps the normal authenticated custom_fields.*
    permission gate."""

    def get_permissions(self):
        entity = self.request.query_params.get("entity") or self.request.data.get("entity")
        if entity == "application":
            return [AllowAny()]
        return super().get_permissions()


class CustomFieldsView(CustomFieldsPermissionMixin, ListCreateAPIView):
    serializer_class = CustomFieldSerializer

    def get_queryset(self):
        qs = CustomField.objects.all()
        entity = self.request.query_params.get("entity")
        if entity:
            qs = qs.filter(entity=entity)
        return qs

    def perform_create(self, serializer):
        field = serializer.save()
        log(actor=self.request.user, action="custom_fields.field_created", target=field, request=self.request)


class CustomFieldDetailView(CustomFieldsPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = CustomFieldSerializer
    queryset = CustomField.objects.all()
    lookup_url_kwarg = "field_id"

    def perform_update(self, serializer):
        field = serializer.save()
        log(actor=self.request.user, action="custom_fields.field_updated", target=field, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="custom_fields.field_deleted", target=instance, request=self.request)
        instance.delete()


class CustomFieldValuesView(PublicApplicationValuesMixin, CustomFieldsPermissionMixin, APIView):
    """GET returns every active field for the given entity, each carrying
    its current value (or None) for the given entity_id — one call gives the
    frontend everything it needs to render the dynamic section of a
    Student/Staff form."""

    def get(self, request):
        entity = request.query_params.get("entity")
        entity_id = request.query_params.get("entity_id")
        if not entity:
            return failure(message="entity is required.", status=400)

        fields = CustomField.objects.filter(entity=entity, is_active=True)
        values_by_field_id = {}
        if entity_id:
            values_by_field_id = {
                str(v.field_id): v.value
                for v in CustomFieldValue.objects.filter(field__entity=entity, entity_id=entity_id)
            }
        data = [
            {
                "field_id": str(f.id), "key": f.key, "label": f.label, "field_type": f.field_type,
                "options": f.options, "required": f.required,
                "value": values_by_field_id.get(str(f.id)),
            }
            for f in fields
        ]
        return success(data=data)


class CustomFieldValuesBulkUpsertView(PublicApplicationValuesMixin, CustomFieldsPermissionMixin, APIView):
    def put(self, request):
        serializer = CustomFieldValueBulkUpsertSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        entity = serializer.validated_data["entity"]
        entity_id = serializer.validated_data["entity_id"]

        updated = []
        for item in serializer.validated_data["values"]:
            field = get_object_or_404(CustomField, id=item["field_id"], entity=entity)
            value, _ = CustomFieldValue.objects.update_or_create(
                field=field, entity_id=entity_id, defaults={"value": item.get("value")},
            )
            updated.append(str(field.id))

        actor = request.user if request.user.is_authenticated else None
        log(actor=actor, action="custom_fields.values_updated",
            changes={"entity": entity, "entity_id": str(entity_id), "field_ids": updated}, request=request)
        return success(message="Custom field values saved.", data={"updated_field_ids": updated})
