from apps.realtime.services import push_to_user
from apps.settings_app.models import SystemSetting

from .models import Notification
from .serializers import NotificationSerializer
from .tasks import send_credentials_email_task, send_email, send_push, send_sms, send_whatsapp


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


def send_credentials_email(user, plain_password, portal_label, delivery_email=None):
    """Login credentials for a freshly-created portal account. Deliberately
    bypasses dispatch(): a temporary password must never sit in the
    Notification table (visible via the in-app bell/history) or ride the
    school's configured default channels — it goes out over email only,
    async via Celery like every other outbound channel here, the same
    one-shot way other temp-password flows in this app already treat them
    (surfaced once, never persisted anywhere else).

    `delivery_email` lets a caller redirect WHERE the email is sent (e.g. a
    young student with no email of their own, whose credentials go to their
    guardian instead) while the message itself still shows the account's
    real login handle (email if it has one, else the Student ID/identifier)."""
    delivery_email = delivery_email or user.email
    if not delivery_email:
        return
    send_credentials_email_task.delay(user.id, plain_password, portal_label, delivery_email)
