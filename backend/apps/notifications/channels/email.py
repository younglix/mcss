import logging

from django.core.mail import get_connection, send_mail

from apps.settings_app.models import SystemSetting

logger = logging.getLogger(__name__)


def _smtp_config():
    """Reads Communication settings' Email group. Returns None if no host
    is configured yet, so callers can fall back rather than fail against
    Django's default (unreachable) localhost:25."""
    settings_by_key = {
        s.key: s.get_decrypted_value()
        for s in SystemSetting.objects.filter(key__in=[
            "email.host", "email.port", "email.username", "email.password", "email.from", "email.use_tls",
        ])
    }
    host = settings_by_key.get("email.host")
    if not host:
        return None
    return {
        "host": host,
        "port": int(settings_by_key.get("email.port") or 587),
        "username": settings_by_key.get("email.username") or None,
        "password": settings_by_key.get("email.password") or None,
        "use_tls": bool(settings_by_key.get("email.use_tls", True)),
        "from_email": settings_by_key.get("email.from") or None,
    }


def send(recipient, title, body):
    if not recipient.email:
        logger.warning("Cannot send email notification: user %s has no email.", recipient.id)
        return

    config = _smtp_config()
    if not config:
        logger.info("Email not sent to %s: no SMTP host configured (Communication settings).", recipient.email)
        return

    connection = get_connection(
        host=config["host"], port=config["port"], username=config["username"],
        password=config["password"], use_tls=config["use_tls"], fail_silently=False,
    )
    try:
        send_mail(
            subject=title, message=body, from_email=config["from_email"],
            recipient_list=[recipient.email], connection=connection,
        )
    except Exception:
        logger.exception("Failed to send email to %s via configured SMTP.", recipient.email)
