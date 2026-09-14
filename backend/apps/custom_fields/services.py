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


def ordered_active_fields(entity):
    """Active fields for an entity, sorted so same-Data-Title fields sit
    together in their group's own order, with ungrouped fields first
    (unchanged position from before Data Titles existed) — the order every
    renderer of dynamic fields (admin views, the public Apply/Staff forms)
    shows fields in."""
    fields = list(active_fields(entity).select_related("group"))
    return sorted(fields, key=lambda f: (1, f.group.order, f.group_id.hex) if f.group_id else (0, 0, ""))


def field_summary(f):
    """The definition shape every dynamic-field consumer (admin, public
    Apply/Staff forms) sends to its frontend — no value, just what the field
    is and how to render it."""
    return {
        "field_id": str(f.id), "key": f.key, "label": f.label, "field_type": f.field_type,
        "options": f.options, "placeholder": f.placeholder, "required": f.required, "is_sensitive": f.is_sensitive,
        "group_id": str(f.group_id) if f.group_id else None, "group_label": f.group.name if f.group_id else None,
    }


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
