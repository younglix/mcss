from django.db import models

from common.models import BaseModel


class CustomField(BaseModel):
    """A Super Admin-defined extra field on Student or Staff records.
    Scoped to these two entities for now (System & Config Phase 5); adding a
    third entity later just means adding a choice here, not a new subsystem."""

    class Entity(models.TextChoices):
        STUDENT = "student", "Student"
        STAFF = "staff", "Staff"
        PARENT = "parent", "Parent"
        APPLICATION = "application", "Admission Application"

    class FieldType(models.TextChoices):
        TEXT = "text", "Text"
        TEXTAREA = "textarea", "Paragraph"
        NUMBER = "number", "Number"
        DATE = "date", "Date"
        SELECT = "select", "Dropdown"
        CHECKBOX = "checkbox", "Yes/No"
        ATTACHMENT = "attachment", "Attachment"

    entity = models.CharField(max_length=20, choices=Entity.choices)
    # Optional "Data Title" grouping (e.g. "Biodata", "Medical Info") a Super
    # Admin defines per entity to organize related fields together, both in
    # the admin's own field list and as a section heading wherever the field
    # renders on a real form. SET_NULL (not CASCADE) so deleting a group only
    # ungroups its fields — never silently destroys field definitions or the
    # values already saved against them.
    group = models.ForeignKey("CustomFieldGroup", on_delete=models.SET_NULL, null=True, blank=True, related_name="fields")
    key = models.SlugField(max_length=60)
    label = models.CharField(max_length=100)
    field_type = models.CharField(max_length=20, choices=FieldType.choices, default=FieldType.TEXT)
    options = models.JSONField(default=list, blank=True)  # ["Option A", "Option B"] — only used when field_type=select
    # Shown inside the input on the actual form (e.g. "Enter your phone
    # number") — purely a UI hint for whoever fills the field in, never
    # validated against or stored as part of the value.
    placeholder = models.CharField(max_length=200, blank=True, default="")
    required = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    # e.g. NIN, bank account number — stored as plain text (no encryption asked
    # for), but never returned in full to a non-superadmin reader; see
    # CustomFieldValueSerializer / the self-service view in this app.
    is_sensitive = models.BooleanField(default=False)

    class Meta(BaseModel.Meta):
        ordering = ["entity", "order", "label"]
        constraints = [
            models.UniqueConstraint(fields=["entity", "key"], condition=models.Q(is_deleted=False), name="unique_active_entity_key"),
        ]

    def __str__(self):
        return f"{self.get_entity_display()}: {self.label}"


class CustomFieldGroup(BaseModel):
    """A Super Admin-defined "Data Title" (e.g. "Biodata") that CustomFields
    are organized under, scoped to the same entity as the fields it groups."""

    entity = models.CharField(max_length=20, choices=CustomField.Entity.choices)
    name = models.CharField(max_length=100)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        ordering = ["entity", "order", "name"]

    def __str__(self):
        return f"{self.get_entity_display()}: {self.name}"


class CustomFieldValue(BaseModel):
    """One field's value for one Student or Staff record. `entity_id` points
    at academics.Student.id or accounts.User.id depending on field.entity —
    a plain UUID rather than a GenericForeignKey since there are only ever
    these two known entity types, resolved via `field.entity`."""

    field = models.ForeignKey(CustomField, on_delete=models.CASCADE, related_name="values")
    entity_id = models.UUIDField()
    value = models.JSONField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["field__order"]
        constraints = [
            models.UniqueConstraint(fields=["field", "entity_id"], condition=models.Q(is_deleted=False), name="unique_active_field_entity_value"),
        ]
        indexes = [models.Index(fields=["entity_id"])]

    def __str__(self):
        return f"{self.field.key} @ {self.entity_id}"
