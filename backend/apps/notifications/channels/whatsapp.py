import logging

from apps.settings_app.models import SystemSetting

logger = logging.getLogger(__name__)


def send(recipient, body):
    if not recipient.phone:
        logger.warning("Cannot send WhatsApp notification: user %s has no phone.", recipient.id)
        return
    settings_by_key = {s.key: s.value for s in SystemSetting.objects.filter(key__in=["whatsapp.provider", "whatsapp.business_number"])}
    provider_name = settings_by_key.get("whatsapp.provider")
    if not provider_name:
        logger.info("WhatsApp not sent to %s: no WhatsApp provider configured (Communication settings).", recipient.phone)
        return
    # Same pattern as sms.py — wired the same way once a WhatsApp Business
    # API key lands in Communication settings.
    logger.info("WhatsApp via %s (business number %s) to %s: %s", provider_name, settings_by_key.get("whatsapp.business_number"), recipient.phone, body)
