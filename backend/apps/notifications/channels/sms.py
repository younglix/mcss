import logging

logger = logging.getLogger(__name__)


def send(recipient, body):
    # Real provider (Termii/Twilio/etc.) wired later via the "sms" SystemSetting
    # group; until then this degrades to a log line so the call site and
    # Celery task plumbing are already correct when a provider lands.
    if not recipient.phone:
        logger.warning("Cannot send SMS notification: user %s has no phone.", recipient.id)
        return
    logger.info("SMS to %s: %s", recipient.phone, body)
