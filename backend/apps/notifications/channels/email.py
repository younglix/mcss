import logging

from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send(recipient, title, body):
    if not recipient.email:
        logger.warning("Cannot send email notification: user %s has no email.", recipient.id)
        return
    send_mail(subject=title, message=body, from_email=None, recipient_list=[recipient.email], fail_silently=True)
