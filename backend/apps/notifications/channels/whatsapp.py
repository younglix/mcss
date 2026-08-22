import logging

logger = logging.getLogger(__name__)


def send(recipient, body):
    # Wired the same way as sms.py once a WhatsApp Business API key lands
    # in system settings.
    if not recipient.phone:
        logger.warning("Cannot send WhatsApp notification: user %s has no phone.", recipient.id)
        return
    logger.info("WhatsApp to %s: %s", recipient.phone, body)
