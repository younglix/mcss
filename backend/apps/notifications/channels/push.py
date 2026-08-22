import logging

logger = logging.getLogger(__name__)


def send(recipient, title, body):
    # Web push (VAPID) or FCM wired later; the in-app bell already gets the
    # notification instantly over the WebSocket regardless of this channel.
    logger.info("Push to %s: %s — %s", recipient.id, title, body)
