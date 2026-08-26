import logging

from apps.settings_app.models import SystemSetting

logger = logging.getLogger(__name__)


def send(recipient, body):
    if not recipient.phone:
        logger.warning("Cannot send SMS notification: user %s has no phone.", recipient.id)
        return
    provider = SystemSetting.objects.filter(key="sms.provider").first()
    provider_name = provider.value if provider and provider.value else None
    if not provider_name:
        logger.info("SMS not sent to %s: no SMS provider configured (Communication settings).", recipient.phone)
        return
    # Real provider (Termii/Twilio/etc.) API call goes here once a provider
    # SDK/credentials are wired in — the configured provider/sender_id and
    # call site are already correct, so swapping this log line for a real
    # request is the only remaining step.
    logger.info("SMS via %s to %s: %s", provider_name, recipient.phone, body)
