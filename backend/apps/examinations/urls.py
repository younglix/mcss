from django.urls import path

from . import views

urlpatterns = [
    path("terms", views.ExamTermsView.as_view(), name="exam-terms"),

    # Question banks (teacher authoring + officer approval)
    path("banks", views.QuestionBanksView.as_view(), name="exam-banks"),
    path("banks/<uuid:bank_id>", views.QuestionBankDetailView.as_view(), name="exam-bank-detail"),
    path("banks/<uuid:bank_id>/questions", views.QuestionBankSubmitView.as_view(), name="exam-bank-submit"),
    path("banks/<uuid:bank_id>/approve", views.QuestionBankApproveView.as_view(), name="exam-bank-approve"),
    path("questions/<uuid:question_id>", views.QuestionDetailView.as_view(), name="exam-question-detail"),

    # CBE exam configuration + lifecycle (Exam Officer)
    path("exams", views.ExamsView.as_view(), name="exam-exams"),
    path("exams/<uuid:exam_id>", views.ExamDetailView.as_view(), name="exam-exam-detail"),
    path("exams/<uuid:exam_id>/activate", views.ExamActivateView.as_view(), name="exam-exam-activate"),
    path("exams/<uuid:exam_id>/end", views.ExamEndView.as_view(), name="exam-exam-end"),
    path("exams/<uuid:exam_id>/monitor", views.ExamMonitorView.as_view(), name="exam-exam-monitor"),
    path("attempts/<uuid:attempt_id>/reset", views.AttemptResetView.as_view(), name="exam-attempt-reset"),

    # Student: access + attempt
    path("access/login", views.ExamAccessLoginView.as_view(), name="exam-access-login"),
    path("exams/<uuid:exam_id>/attempts/start", views.AttemptStartView.as_view(), name="exam-attempt-start"),
    path("attempts/<uuid:attempt_id>/answer", views.AttemptAnswerView.as_view(), name="exam-attempt-answer"),
    path("attempts/<uuid:attempt_id>/submit", views.AttemptSubmitView.as_view(), name="exam-attempt-submit"),
    path("attempts/<uuid:attempt_id>/exit", views.AttemptExitView.as_view(), name="exam-attempt-exit"),
]
