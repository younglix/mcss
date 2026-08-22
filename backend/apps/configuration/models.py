from django.db import models

from common.models import BaseModel


class SchoolProfile(BaseModel):
    name = models.CharField(max_length=200)
    logo = models.URLField(blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    motto = models.CharField(max_length=200, blank=True)

    class Meta(BaseModel.Meta):
        pass

    def __str__(self):
        return self.name


class AcademicSession(BaseModel):
    name = models.CharField(max_length=20, unique=True)   # "2026/2027"
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta(BaseModel.Meta):
        ordering = ["-start_date"]

    def __str__(self):
        return self.name


class Term(BaseModel):
    session = models.ForeignKey(AcademicSession, on_delete=models.CASCADE, related_name="terms")
    name = models.CharField(max_length=30)   # "First", "Second", "Third"
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta(BaseModel.Meta):
        ordering = ["start_date"]
        unique_together = ("session", "name")

    def __str__(self):
        return f"{self.name} Term — {self.session.name}"


class Department(BaseModel):
    name = models.CharField(max_length=100, unique=True)

    class Meta(BaseModel.Meta):
        ordering = ["name"]

    def __str__(self):
        return self.name


class SchoolClass(BaseModel):
    name = models.CharField(max_length=50, unique=True)   # "JSS 1", "SS 2"
    level_order = models.PositiveIntegerField()             # drives promotion ordering

    class Meta(BaseModel.Meta):
        ordering = ["level_order"]

    def __str__(self):
        return self.name


class ClassArm(BaseModel):
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name="arms")
    name = models.CharField(max_length=10)   # "A", "B"

    class Meta(BaseModel.Meta):
        ordering = ["school_class__level_order", "name"]
        unique_together = ("school_class", "name")

    def __str__(self):
        return f"{self.school_class.name} {self.name}"


class GradeScale(BaseModel):
    name = models.CharField(max_length=50)          # "A1", "B2"...
    min_score = models.PositiveIntegerField()
    max_score = models.PositiveIntegerField()
    remark = models.CharField(max_length=50)         # "Excellent"
    grade_point = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["-max_score"]

    def __str__(self):
        return f"{self.name} ({self.min_score}-{self.max_score})"


class FeeCategory(BaseModel):
    name = models.CharField(max_length=100, unique=True)   # "Tuition", "ICT", "Development"
    is_recurring = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        ordering = ["name"]

    def __str__(self):
        return self.name
