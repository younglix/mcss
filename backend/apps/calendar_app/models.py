from django.db import models

from common.models import BaseModel


class Event(BaseModel):
    class Audience(models.TextChoices):
        ALL = "all", "Everyone"
        STAFF = "staff", "Staff"
        STUDENTS = "students", "Students"
        PARENTS = "parents", "Parents"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField(null=True, blank=True)
    all_day = models.BooleanField(default=False)
    location = models.CharField(max_length=200, blank=True)
    audience = models.CharField(max_length=20, choices=Audience.choices, default=Audience.ALL)

    class Meta(BaseModel.Meta):
        ordering = ["start_at"]

    def __str__(self):
        return self.title
