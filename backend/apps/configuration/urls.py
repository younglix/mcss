from django.urls import path

from . import views

urlpatterns = [
    path("school-profile", views.SchoolProfileView.as_view(), name="config-school-profile"),
    path("sessions", views.SessionsView.as_view(), name="config-sessions"),
    path("sessions/<uuid:session_id>", views.SessionDetailView.as_view(), name="config-session-detail"),
    path("sessions/<uuid:session_id>/set-current", views.SessionSetCurrentView.as_view(), name="config-session-set-current"),
    path("sessions/<uuid:session_id>/terms", views.SessionTermsView.as_view(), name="config-session-terms"),
    path("terms/<uuid:term_id>", views.TermDetailView.as_view(), name="config-term-detail"),
    path("terms/<uuid:term_id>/set-current", views.TermSetCurrentView.as_view(), name="config-term-set-current"),
    path("classes", views.ClassesView.as_view(), name="config-classes"),
    path("classes/<uuid:class_id>", views.ClassDetailView.as_view(), name="config-class-detail"),
    path("classes/<uuid:class_id>/arms", views.ClassArmsView.as_view(), name="config-class-arms"),
    path("classes/arms/<uuid:arm_id>", views.ClassArmDetailView.as_view(), name="config-class-arm-detail"),
    path("departments", views.DepartmentsView.as_view(), name="config-departments"),
    path("departments/<uuid:department_id>", views.DepartmentDetailView.as_view(), name="config-department-detail"),
    path("grade-scales", views.GradeScalesView.as_view(), name="config-grade-scales"),
    path("fee-categories", views.FeeCategoriesView.as_view(), name="config-fee-categories"),
]
