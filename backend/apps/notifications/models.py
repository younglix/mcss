from django.db import models

from common.models import BaseModel


class Notification(BaseModel):
    recipient = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=200)
    body = models.TextField()
    category = models.CharField(max_length=50)          # "payment", "attendance", "approval"...
    data = models.JSONField(default=dict)                # deep-link payload
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        indexes = [models.Index(fields=["recipient", "is_read"])]
