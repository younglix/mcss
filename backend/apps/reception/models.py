from django.db import models

from common.models import BaseModel


class VisitorLog(BaseModel):
    class Status(models.TextChoices):
        CHECKED_IN = "checked_in", "Checked In"
        CHECKED_OUT = "checked_out", "Checked Out"

    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True)
    purpose = models.CharField(max_length=255)
    person_to_see = models.CharField(max_length=150, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CHECKED_IN)
    checked_in_at = models.DateTimeField(auto_now_add=True)
    checked_out_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["-checked_in_at"]

    def __str__(self):
        return f"{self.full_name} — {self.purpose}"
