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


class NumberSequence(BaseModel):
    """Backs the numbering.* format settings (numbering.py) — one running
    counter per (document key, year), so 'MC/{year}/{seq:04}' etc. produce
    gapless, collision-free numbers under concurrent requests."""

    key = models.CharField(max_length=50)   # "admission", "application", "receipt", "invoice", "expense", "staff"
    year = models.IntegerField()
    last_seq = models.PositiveIntegerField(default=0)

    class Meta(BaseModel.Meta):
        unique_together = ("key", "year")

    def __str__(self):
        return f"{self.key}/{self.year} -> {self.last_seq}"
