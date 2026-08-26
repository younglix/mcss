from apps.realtime.services import push_to_user
from apps.settings_app.models import SystemSetting

from .models import Notification
from .serializers import NotificationSerializer
from .tasks import send_email, send_push, send_sms, send_whatsapp


def _default_channels():
    setting = SystemSetting.objects.filter(key="notifications.channels").first()
    return setting.value if setting and setting.value else ["in_app"]


def dispatch(recipient, title, body, category, channels=None, data=None):
    """channels=None uses the Communication settings' configured default
    (notifications.channels) rather than a hardcoded in_app-only list, so
    changing that setting actually changes what gets sent without every
    call site needing to be updated."""
    if channels is None:
        channels = _default_channels()

    notification = Notification.objects.create(
        recipient=recipient, title=title, body=body, category=category, data=data or {}
    )
    # 1) live push to the bell
    push_to_user(recipient.id, NotificationSerializer(notification).data)
    # 2) external channels, async
    if "email" in channels:
        send_email.delay(recipient.id, title, body)
    if "sms" in channels:
        send_sms.delay(recipient.id, body)
    if "push" in channels:
        send_push.delay(recipient.id, title, body)
    if "whatsapp" in channels:
        send_whatsapp.delay(recipient.id, body)
    return notification
