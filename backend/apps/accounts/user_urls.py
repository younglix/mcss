from django.urls import path

from . import views

urlpatterns = [
    path("", views.UsersView.as_view(), name="users-list"),
    path("<uuid:pk>", views.UserDetailView.as_view(), name="users-detail"),
    path("<uuid:user_id>/reset-password", views.UserResetPasswordView.as_view(), name="users-reset-password"),
]
