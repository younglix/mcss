import uuid
from pathlib import Path

from django.conf import settings as django_settings
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.audit.services import log
from apps.rbac.permissions import HasPermission
from common.responses import failure, success

from .models import CustomField, CustomFieldGroup, CustomFieldValue
from .serializers import CustomFieldGroupSerializer, CustomFieldSerializer, CustomFieldValueBulkUpsertSerializer
from .services import (
    MASKED_VALUE,
    field_summary as _field_summary,
    mask_if_sensitive as _mask_if_sensitive,
    ordered_active_fields as _ordered_active_fields,
)

User = get_user_model()


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


class CustomFieldGroupsView(CustomFieldsPermissionMixin, ListCreateAPIView):
    """"Data Title" groups a Super Admin defines to organize fields under,
    e.g. "Biodata". Scoped to one entity at a time, same as CustomFieldsView."""

    serializer_class = CustomFieldGroupSerializer

    def get_queryset(self):
        qs = CustomFieldGroup.objects.all()
        entity = self.request.query_params.get("entity")
        if entity:
            qs = qs.filter(entity=entity)
        return qs

    def perform_create(self, serializer):
        group = serializer.save()
        log(actor=self.request.user, action="custom_fields.group_created", target=group, request=self.request)


class CustomFieldGroupDetailView(CustomFieldsPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = CustomFieldGroupSerializer
    queryset = CustomFieldGroup.objects.all()
    lookup_url_kwarg = "group_id"

    def perform_update(self, serializer):
        group = serializer.save()
        log(actor=self.request.user, action="custom_fields.group_updated", target=group, request=self.request)

    def perform_destroy(self, instance):
        # SET_NULL on CustomField.group — deleting a Data Title only ungroups
        # its fields, never deletes the fields or their saved values.
        log(actor=self.request.user, action="custom_fields.group_deleted", target=instance, request=self.request)
        instance.delete()


class CustomFieldAttachmentUploadView(APIView):
    """Raw file upload backing the 'attachment' custom-field type — same
    storage plumbing as every other upload endpoint in the app (S3 when
    configured, local disk only in DEBUG). Deliberately public: custom
    fields render on unauthenticated forms too (the Admissions Apply
    wizard, Staff Onboarding registration — see PublicApplicationValuesMixin
    above and apps.staff_onboarding's own public config view), and a
    field's value has to already be a real URL by the time that form is
    submitted, same as every other field type's value already works. This
    is the one upload endpoint in the app that doesn't require login, so
    unlike its siblings (HRFileUploadView, MyTeachingResourceUploadView,
    AssetUploadView) it's rate-limited and restricted to a fixed set of
    document/image extensions rather than "any file"."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public_upload"
    MAX_BYTES = 10 * 1024 * 1024
    ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"}

    def post(self, request):
        if not django_settings.DEBUG and not django_settings.S3_CONFIGURED:
            return failure(message="File storage isn't configured yet.", status=503)
        file = request.FILES.get("file")
        if not file:
            return failure(message="No file provided.", status=400)
        if file.size > self.MAX_BYTES:
            return failure(message="File must be smaller than 10MB.", status=400)
        ext = Path(file.name).suffix.lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            return failure(message="Only PDF, JPG, PNG, DOC, or DOCX files are allowed.", status=400)
        saved_path = default_storage.save(f"custom-field-attachments/{uuid.uuid4().hex}{ext}", file)
        url = default_storage.url(saved_path)
        actor = request.user if request.user.is_authenticated else None
        log(actor=actor, action="custom_fields.attachment_uploaded", changes={"path": saved_path}, request=request)
        return success(data={"url": url, "file_name": file.name})


class CustomFieldValuesView(PublicApplicationValuesMixin, CustomFieldsPermissionMixin, APIView):
    """GET returns every active field for the given entity, each carrying
    its current value (or None) for the given entity_id — one call gives the
    frontend everything it needs to render the dynamic section of a
    Student/Staff form. A sensitive field's saved value is masked for anyone
    viewing but the Super Admin, including the HR/staff user who otherwise
    holds custom_fields.view for this exact screen."""

    def get(self, request):
        entity = request.query_params.get("entity")
        entity_id = request.query_params.get("entity_id")
        if not entity:
            return failure(message="entity is required.", status=400)

        fields = _ordered_active_fields(entity)
        values_by_field_id = {}
        if entity_id:
            values_by_field_id = {
                str(v.field_id): v.value
                for v in CustomFieldValue.objects.filter(field__entity=entity, entity_id=entity_id)
            }
        data = []
        for f in fields:
            raw = values_by_field_id.get(str(f.id))
            shown, is_masked = _mask_if_sensitive(f, raw, request.user)
            data.append({**_field_summary(f), "value": shown, "is_masked": is_masked})
        return success(data=data)


class ProfileCompletenessView(CustomFieldsPermissionMixin, APIView):
    """Requirement 9 — "View existing users with incomplete/newly added
    fields." Read-only: with only the global self-edit switch (no per-user
    lock state), this is a report to work from, not something with its own
    unlock action — Super Admin corrects a gap the same way as any other
    edit, via the existing admin custom-fields endpoints, or the affected
    person fills it in themselves once self-editing is next open."""

    def get(self, request):
        entity = request.query_params.get("entity")
        if entity not in CustomField.Entity.values:
            return failure(message="A valid entity is required.", status=400)

        required_fields = list(CustomField.objects.filter(entity=entity, is_active=True, required=True))
        if not required_fields:
            return success(data=[])

        entities = _entities_for(entity)
        values_by_entity = {}
        for v in CustomFieldValue.objects.filter(field__in=required_fields, entity_id__in=[e["id"] for e in entities]):
            values_by_entity.setdefault(str(v.entity_id), set()).add(str(v.field_id))

        report = []
        for e in entities:
            have = values_by_entity.get(str(e["id"]), set())
            missing = [f.label for f in required_fields if str(f.id) not in have]
            if missing:
                report.append({"entity_id": str(e["id"]), "name": e["name"], "missing_fields": missing})
        return success(data=report)


def _entities_for(entity):
    """[{id, name}] for every real record of this custom-field entity type —
    the same (entity, entity_id) shape CustomFieldValue rows key against."""
    if entity == CustomField.Entity.STAFF:
        return [{"id": u.id, "name": u.full_name} for u in User.objects.filter(user_type="staff", is_deleted=False, is_active=True)]
    if entity == CustomField.Entity.PARENT:
        return [{"id": u.id, "name": u.full_name} for u in User.objects.filter(user_type="parent", is_deleted=False, is_active=True)]
    if entity == CustomField.Entity.STUDENT:
        from apps.academics.models import Student

        return [{"id": s.id, "name": s.user.full_name} for s in Student.objects.filter(is_deleted=False).select_related("user")]
    return []


class CustomFieldValuesBulkUpsertView(PublicApplicationValuesMixin, CustomFieldsPermissionMixin, APIView):
    def put(self, request):
        serializer = CustomFieldValueBulkUpsertSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        entity = serializer.validated_data["entity"]
        entity_id = serializer.validated_data["entity_id"]

        updated = []
        for item in serializer.validated_data["values"]:
            field = get_object_or_404(CustomField, id=item["field_id"], entity=entity)
            # A masked placeholder coming back from a form the caller never
            # actually saw the real value on must never overwrite the real
            # saved value — only a genuine new value gets written.
            if field.is_sensitive and item.get("value") == MASKED_VALUE:
                continue
            value, _ = CustomFieldValue.objects.update_or_create(
                field=field, entity_id=entity_id, defaults={"value": item.get("value")},
            )
            updated.append(str(field.id))

        actor = request.user if request.user.is_authenticated else None
        log(actor=actor, action="custom_fields.values_updated",
            changes={"entity": entity, "entity_id": str(entity_id), "field_ids": updated}, request=request)
        return success(message="Custom field values saved.", data={"updated_field_ids": updated})


# ---------------------------------------------------------------------------
# Self-service — "Edit Profile" (Requirement 1). Every role gets exactly one
# of these: staff, parent, or student. Deliberately separate from the admin
# CustomFieldValuesView/BulkUpsertView above rather than a shared view with
# branching — the two are different trust boundaries (an admin caller names
# ANY entity_id; a self-service caller can only ever act on their own,
# resolved server-side, never taken from the request).
# ---------------------------------------------------------------------------
def _resolve_own_entity(user):
    """(entity, entity_id) for this logged-in user's own self-service
    profile — or (None, None) if this account type has no self-service
    profile (e.g. an applicant, who isn't authenticated here anyway)."""
    if user.user_type == User.UserType.STAFF:
        return CustomField.Entity.STAFF, user.id
    if user.user_type == User.UserType.PARENT:
        return CustomField.Entity.PARENT, user.id
    if user.user_type == User.UserType.STUDENT:
        student = getattr(user, "student_profile", None)
        if student:
            return CustomField.Entity.STUDENT, student.id
    return None, None


def _self_edit_open():
    """The Super Admin's global switch (Requirement 1's "Net model" — a
    single open/closed toggle, not per-user auto-locking). Defaults open if
    the setting is somehow missing rather than locking everyone out."""
    from apps.settings_app.models import SystemSetting

    setting = SystemSetting.objects.filter(key="profiles.self_edit_open").first()
    return bool(setting.value) if setting else True


class MyProfileFieldsView(APIView):
    """Self-service Edit Profile. GET always works, even while locked, so
    the screen can show a read-only view of what's on file; PUT is refused
    once the Super Admin has closed self-editing — except for the Super
    Admin themself, who can always edit anyone (including via the admin
    endpoints above) regardless of the switch."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        entity, entity_id = _resolve_own_entity(request.user)
        if entity is None:
            return success(data={"entity": None, "locked": True, "fields": []})

        fields = _ordered_active_fields(entity)
        values_by_field_id = {
            str(v.field_id): v.value
            for v in CustomFieldValue.objects.filter(field__entity=entity, entity_id=entity_id)
        }
        data = []
        for f in fields:
            raw = values_by_field_id.get(str(f.id))
            shown, is_masked = _mask_if_sensitive(f, raw, request.user)
            data.append({**_field_summary(f), "value": shown, "is_masked": is_masked})
        locked = not (_self_edit_open() or request.user.is_superadmin)
        return success(data={"entity": entity, "locked": locked, "fields": data})

    def put(self, request):
        entity, entity_id = _resolve_own_entity(request.user)
        if entity is None:
            return failure(message="Your account type doesn't have a self-service profile.", status=400)
        if not _self_edit_open() and not request.user.is_superadmin:
            return failure(message="Profile editing is currently closed. Contact the school administrator.", status=403)

        values = request.data.get("values") or []
        updated = []
        for item in values:
            field = CustomField.objects.filter(id=item.get("field_id"), entity=entity, is_active=True).first()
            if not field:
                continue
            if field.is_sensitive and item.get("value") == MASKED_VALUE:
                continue  # the placeholder came back unchanged — not a real edit
            CustomFieldValue.objects.update_or_create(
                field=field, entity_id=entity_id, defaults={"value": item.get("value")},
            )
            updated.append(str(field.id))

        log(actor=request.user, action="custom_fields.self_values_updated",
            changes={"entity": entity, "field_ids": updated}, request=request)
        return success(message="Profile saved.", data={"updated_field_ids": updated})
