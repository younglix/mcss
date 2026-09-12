"""Shared helpers for anything that collects dynamic CustomField answers on
a not-yet-approved submission (apps.staff_onboarding.StaffApplication,
apps.admissions.Application) and needs to promote them into real
CustomFieldValue rows once a real entity_id exists (a User, a Student, ...).
One implementation so "dynamic fields work the same everywhere" is actually
true rather than three parallel copies of the same loop."""
from .models import CustomField, CustomFieldValue

# Shown in place of a saved sensitive value (NIN, bank account, ...) for
# anyone who isn't the Super Admin — masked once saved and only fully
# visible to the Super Admin. Stored as plain text (no encryption asked
# for); this is a display-time redaction only, applied everywhere a
# sensitive field's value might be shown: the profile-edit screens, the
# admin custom-fields view, and a pending onboarding/application review.
MASKED_VALUE = "••••••"


def mask_if_sensitive(field, value, viewer):
    """Whether `value` should be hidden from `viewer`, and what to show
    instead. Only the Super Admin ever sees a saved sensitive value in full —
    not even the person who entered it, and not HR."""
    is_masked = bool(field.is_sensitive and value not in (None, "") and not viewer.is_superadmin)
    return (MASKED_VALUE if is_masked else value), is_masked


def active_fields(entity):
    return CustomField.objects.filter(entity=entity, is_active=True)


def missing_required_fields(entity, submitted_by_field_id):
    """Active required fields for `entity` that have no truthy entry in
    `submitted_by_field_id` ({field_id (str): value}) — used by a public
    submit serializer's validate() to report exactly which required dynamic
    fields were left blank, the same way a hardcoded field would."""
    missing = []
    for field in active_fields(entity).filter(required=True):
        if not submitted_by_field_id.get(str(field.id)):
            missing.append(field.label)
    return missing


def promote_pending_values(entity_id, pending_values):
    """Writes every (field, value) pair in `pending_values` — an iterable of
    objects each carrying `.field` (a CustomField) and `.value` — into a
    real CustomFieldValue for `entity_id`. This is the one place "an
    onboarding/application answer becomes part of the real profile" happens,
    called from both apps.staff_onboarding and apps.admissions at approval."""
    updated = []
    for pending in pending_values:
        CustomFieldValue.objects.update_or_create(
            field=pending.field, entity_id=entity_id, defaults={"value": pending.value},
        )
        updated.append(str(pending.field_id))
    return updated
