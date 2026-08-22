from apps.realtime.services import push_to_user

from .models import Notification
from .serializers import NotificationSerializer
from .tasks import send_email, send_push, send_sms


def dispatch(recipient, title, body, category, channels=("in_app",), data=None):
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
    return notification
