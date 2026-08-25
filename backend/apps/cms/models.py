from django.db import models

from common.models import BaseModel


class SiteAnnouncement(BaseModel):
    """
    First slice of the Website/CMS module: editable public-facing notices
    (e.g. an admissions banner on the landing page). Scoped deliberately
    small rather than a full page builder, which has no spec yet.
    """

    title = models.CharField(max_length=200)
    body = models.TextField()
    is_active = models.BooleanField(default=True)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
