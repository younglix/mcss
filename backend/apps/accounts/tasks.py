import logging

from celery import shared_task
from django.core.mail import send_mail
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task
def send_otp_email(email, code):
    send_mail(
        subject="Your Mount Carmel verification code",
        message=f"Your verification code is {code}. It expires in 5 minutes.",
        from_email=None,
        recipient_list=[email],
        fail_silently=True,
    )


@shared_task
def send_otp_sms(phone, code):
    # No SMS gateway wired yet (configured later via settings_app "sms" group).
    # Logging keeps the OTP flow fully testable in dev without a provider.
    logger.info("SMS OTP for %s: %s", phone, code)


@shared_task
def cleanup_expired_auth_artifacts():
    """Nightly: drop expired/consumed OTP challenges and blacklist expired refresh tokens."""
    from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

    from .models import OTPChallenge

    otp_deleted, _ = OTPChallenge.objects.filter(expires_at__lt=timezone.now()).delete()

    expired_outstanding = OutstandingToken.objects.filter(expires_at__lt=timezone.now())
    already_blacklisted = set(BlacklistedToken.objects.values_list("token_id", flat=True))
    newly_blacklisted = 0
    for token in expired_outstanding.exclude(id__in=already_blacklisted):
        BlacklistedToken.objects.create(token=token)
        newly_blacklisted += 1

    logger.info("Cleanup: removed %s OTP challenge(s), blacklisted %s expired token(s).", otp_deleted, newly_blacklisted)
