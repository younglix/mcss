from django.contrib import admin

from .models import (
    AcademicSession,
    ClassArm,
    Department,
    FeeCategory,
    GradeScale,
    SchoolClass,
    SchoolProfile,
    Term,
)


@admin.register(SchoolProfile)
class SchoolProfileAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "phone"]


class TermInline(admin.TabularInline):
    model = Term
    extra = 0


@admin.register(AcademicSession)
class AcademicSessionAdmin(admin.ModelAdmin):
    list_display = ["name", "start_date", "end_date", "is_current"]
    inlines = [TermInline]


class ClassArmInline(admin.TabularInline):
    model = ClassArm
    extra = 0


@admin.register(SchoolClass)
class SchoolClassAdmin(admin.ModelAdmin):
    list_display = ["name", "level_order"]
    inlines = [ClassArmInline]


admin.site.register(Department)
admin.site.register(GradeScale)
admin.site.register(FeeCategory)
