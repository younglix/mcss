from django.contrib import admin

from .models import (
    Assignment,
    AttendanceRecord,
    ClassSubjectAssignment,
    ClassTeacherAssignment,
    Exam,
    ExamScore,
    PromotionRecord,
    Student,
    Subject,
    TimetableSlot,
)

admin.site.register(Subject)
admin.site.register(Student)
admin.site.register(ClassSubjectAssignment)
admin.site.register(ClassTeacherAssignment)
admin.site.register(TimetableSlot)
admin.site.register(AttendanceRecord)
admin.site.register(Exam)
admin.site.register(ExamScore)
admin.site.register(Assignment)
admin.site.register(PromotionRecord)
