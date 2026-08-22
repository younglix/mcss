import json

from django.db import models

from common.models import BaseModel

from .crypto import decrypt_value, encrypt_value


class SystemSetting(BaseModel):
    key = models.CharField(max_length=100, unique=True)   # "sms.provider", "payments.paystack.public_key"
    value = models.JSONField()                              # string, number, bool, or object
    group = models.CharField(max_length=50)                # "sms", "email", "payments", "numbering"
    is_secret = models.BooleanField(default=False)         # masked in API responses, encrypted at rest

    class Meta(BaseModel.Meta):
        ordering = ["group", "key"]

    def __str__(self):
        return self.key

    def set_value(self, raw_value):
        """Encrypts `value` at rest when is_secret, transparent to callers."""
        if self.is_secret:
            self.value = encrypt_value(json.dumps(raw_value))
        else:
            self.value = raw_value

    def get_decrypted_value(self):
        """Internal use only (e.g. dispatching SMS/email) — never expose via API."""
        if not self.is_secret:
            return self.value
        return json.loads(decrypt_value(self.value))
