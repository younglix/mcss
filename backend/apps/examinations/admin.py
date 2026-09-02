from django.contrib import admin

from .models import Attempt, Exam, Question, QuestionBank


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0
    fields = ["text", "option_a", "option_b", "option_c", "option_d", "correct_option"]


@admin.register(QuestionBank)
class QuestionBankAdmin(admin.ModelAdmin):
    list_display = ["subject", "school_class", "term", "is_approved", "approved_by"]
    list_filter = ["is_approved", "school_class", "term"]
    search_fields = ["subject__name", "school_class__name"]
    inlines = [QuestionInline]


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ["title", "subject", "school_class", "status", "activated_at", "ended_at"]
    list_filter = ["status", "school_class"]
    search_fields = ["title"]


@admin.register(Attempt)
class AttemptAdmin(admin.ModelAdmin):
    list_display = ["student", "exam", "status", "raw_score", "penalty_applied", "started_at"]
    list_filter = ["status"]
    search_fields = ["student__user__full_name", "exam__title"]
