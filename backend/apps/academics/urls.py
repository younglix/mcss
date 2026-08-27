from django.urls import path

from . import views

urlpatterns = [
    path("subjects", views.SubjectsView.as_view(), name="academics-subjects"),
    path("subjects/<uuid:subject_id>", views.SubjectDetailView.as_view(), name="academics-subject-detail"),

    path("students", views.StudentsView.as_view(), name="academics-students"),
    path("students/my-children", views.MyChildrenView.as_view(), name="academics-my-children"),
    path("students/mine", views.MyProfileView.as_view(), name="academics-my-profile"),
    path("students/<uuid:pk>", views.StudentDetailView.as_view(), name="academics-student-detail"),

    path("teachers", views.TeachersView.as_view(), name="academics-teachers"),

    path("classes", views.ClassesAcademicView.as_view(), name="academics-classes"),
    path("classes/mine", views.MyClassView.as_view(), name="academics-my-class"),
    path("classes/child/<uuid:student_id>", views.ChildClassView.as_view(), name="academics-child-class"),
    path("classes/<uuid:arm_id>/subjects", views.ClassSubjectAssignmentsView.as_view(), name="academics-class-subjects"),
    path("classes/subjects/<uuid:assignment_id>", views.ClassSubjectAssignmentDetailView.as_view(), name="academics-class-subject-detail"),
    path("classes/<uuid:arm_id>/class-teacher", views.ClassTeacherAssignmentView.as_view(), name="academics-class-teacher"),

    path("timetable", views.TimetableSlotsView.as_view(), name="academics-timetable"),
    path("timetable/mine", views.MyTimetableView.as_view(), name="academics-my-timetable"),
    path("timetable/child/<uuid:student_id>", views.ChildTimetableView.as_view(), name="academics-child-timetable"),
    path("timetable/<uuid:slot_id>", views.TimetableSlotDetailView.as_view(), name="academics-timetable-detail"),

    path("attendance", views.AttendanceRecordsView.as_view(), name="academics-attendance"),
    path("attendance/mine", views.MyAttendanceView.as_view(), name="academics-my-attendance"),
    path("attendance/child/<uuid:student_id>", views.ChildAttendanceView.as_view(), name="academics-child-attendance"),
    path("attendance/bulk-mark", views.AttendanceBulkMarkView.as_view(), name="academics-attendance-bulk-mark"),

    path("exams", views.ExamsView.as_view(), name="academics-exams"),
    path("exams/published", views.PublishedExamsView.as_view(), name="academics-published-exams"),
    path("exams/<uuid:exam_id>", views.ExamDetailView.as_view(), name="academics-exam-detail"),
    path("exams/<uuid:exam_id>/publish", views.ExamPublishView.as_view(), name="academics-exam-publish"),
    path("exams/<uuid:exam_id>/scores", views.ExamScoresView.as_view(), name="academics-exam-scores"),
    path("exams/<uuid:exam_id>/marksheet/<uuid:student_id>", views.MarksheetView.as_view(), name="academics-marksheet"),
    path("exams/<uuid:exam_id>/report-card/<uuid:student_id>", views.ReportCardView.as_view(), name="academics-report-card"),
    path("exams/<uuid:exam_id>/report-card/<uuid:student_id>/remarks", views.ReportCardRemarkView.as_view(), name="academics-report-card-remarks"),
    path("scores/<uuid:score_id>", views.ExamScoreDetailView.as_view(), name="academics-score-detail"),

    path("assignments", views.AssignmentsView.as_view(), name="academics-assignments"),
    path("assignments/mine", views.MyAssignmentsView.as_view(), name="academics-my-assignments"),
    path("assignments/child/<uuid:student_id>", views.ChildAssignmentsView.as_view(), name="academics-child-assignments"),
    path("assignments/<uuid:assignment_id>", views.AssignmentDetailView.as_view(), name="academics-assignment-detail"),

    path("promotion/records", views.PromotionRecordsView.as_view(), name="academics-promotion-records"),
    path("promotion/action", views.PromotionActionView.as_view(), name="academics-promotion-action"),

    path("reports", views.AcademicReportsView.as_view(), name="academics-reports"),
]
