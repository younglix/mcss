from django.db import models

from common.models import BaseModel


class CustomField(BaseModel):
    """A Super Admin-defined extra field on Student or Staff records.
    Scoped to these two entities for now (System & Config Phase 5); adding a
    third entity later just means adding a choice here, not a new subsystem."""

    class Entity(models.TextChoices):
        STUDENT = "student", "Student"
        STAFF = "staff", "Staff"
        APPLICATION = "application", "Admission Application"

    class FieldType(models.TextChoices):
        TEXT = "text", "Text"
        TEXTAREA = "textarea", "Paragraph"
        NUMBER = "number", "Number"
        DATE = "date", "Date"
        SELECT = "select", "Dropdown"
        CHECKBOX = "checkbox", "Yes/No"

    entity = models.CharField(max_length=20, choices=Entity.choices)
    key = models.SlugField(max_length=60)
    label = models.CharField(max_length=100)
    field_type = models.CharField(max_length=20, choices=FieldType.choices, default=FieldType.TEXT)
    options = models.JSONField(default=list, blank=True)  # ["Option A", "Option B"] — only used when field_type=select
    required = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        ordering = ["entity", "order", "label"]
        constraints = [
            models.UniqueConstraint(fields=["entity", "key"], condition=models.Q(is_deleted=False), name="unique_active_entity_key"),
        ]

    def __str__(self):
        return f"{self.get_entity_display()}: {self.label}"


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
