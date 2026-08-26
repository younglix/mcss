from django.core.serializers.json import DjangoJSONEncoder
from django.db import models

from common.models import BaseModel


class AuditLog(BaseModel):
    actor = models.ForeignKey("accounts.User", null=True, on_delete=models.SET_NULL, related_name="audit_logs")
    action = models.CharField(max_length=100)                    # "result.published", "role.permissions_changed"
    target_type = models.CharField(max_length=100, blank=True)   # "Student", "Role"
    target_id = models.CharField(max_length=64, blank=True)
    # DjangoJSONEncoder (not the plain default) so a `changes` dict can carry
    # a raw UUID/Decimal/date/datetime straight from a model without every
    # call site having to remember to str()-wrap it first.
    changes = models.JSONField(default=dict, encoder=DjangoJSONEncoder)  # {"before": {...}, "after": {...}}
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)

    class Meta(BaseModel.Meta):
        indexes = [
            models.Index(fields=["action"]),
            models.Index(fields=["target_type", "target_id"]),
        ]

    def __str__(self):
        return f"{self.action} @ {self.created_at:%Y-%m-%d %H:%M}"


class LoginHistory(BaseModel):
    user = models.ForeignKey("accounts.User", null=True, on_delete=models.SET_NULL, related_name="login_history")
    successful = models.BooleanField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)

    class Meta(BaseModel.Meta):
        indexes = [models.Index(fields=["user"])]
