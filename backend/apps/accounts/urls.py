from django.urls import path

from . import views

urlpatterns = [
    path("login", views.LoginView.as_view(), name="auth-login"),
    path("verify-otp", views.VerifyOTPView.as_view(), name="auth-verify-otp"),
    path("refresh", views.RefreshView.as_view(), name="auth-refresh"),
    path("logout", views.LogoutView.as_view(), name="auth-logout"),
    path("me", views.MeView.as_view(), name="auth-me"),
    path("password/forgot", views.PasswordForgotView.as_view(), name="auth-password-forgot"),
    path("password/reset", views.PasswordResetView.as_view(), name="auth-password-reset"),
    path("password/change", views.PasswordChangeView.as_view(), name="auth-password-change"),
    path("2fa/enable", views.Enable2FAView.as_view(), name="auth-2fa-enable"),
    path("sessions", views.SessionsView.as_view(), name="auth-sessions"),
    path("sessions/<uuid:session_id>", views.SessionRevokeView.as_view(), name="auth-session-revoke"),
]
