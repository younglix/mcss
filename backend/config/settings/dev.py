from .base import *  # noqa: F401,F403

DEBUG = True
ALLOWED_HOSTS = ["*"]

CORS_ALLOW_ALL_ORIGINS = True

# No SMTP provider in local dev — print emails (OTP codes, etc.) to the
# runserver console instead of silently failing to send.
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
