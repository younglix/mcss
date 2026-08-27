from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView

from apps.audit.services import log
from apps.rbac.permissions import HasPermission
from common.responses import success

from . import services
from .models import Notification
from .serializers import BroadcastSerializer, NotificationSerializer

User = get_user_model()


class NotificationsListView(ListAPIView):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        qs = Notification.objects.filter(recipient=self.request.user)
        if self.request.query_params.get("unread") == "true":
            qs = qs.filter(is_read=False)
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)
        return qs


class UnreadCountView(APIView):
    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return success(data={"unread_count": count})


class MarkReadView(APIView):
    def post(self, request, notification_id):
        notification = get_object_or_404(Notification, id=notification_id, recipient=request.user)
        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save(update_fields=["is_read", "read_at"])
        return success(message="Notification marked read.")


class MarkAllReadView(APIView):
    def post(self, request):
        updated = Notification.objects.filter(recipient=request.user, is_read=False).update(
            is_read=True, read_at=timezone.now()
        )
        return success(message="All notifications marked read.", data={"updated": updated})


class BroadcastView(APIView):
    """Communication (Administration): compose a message and fan it out via
    the existing Notification/dispatch pipeline — no separate messaging
    system, this just drives the one that's already there."""
    permission_classes = [HasPermission("communication.send")]

    def post(self, request):
        serializer = BroadcastSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        audience = serializer.validated_data["audience"]

        recipients = User.objects.filter(is_active=True, is_deleted=False)
        if audience != "all":
            recipients = recipients.filter(user_type=audience)

        count = 0
        for recipient in recipients:
            services.dispatch(
                recipient=recipient,
                title=serializer.validated_data["title"],
                body=serializer.validated_data["body"],
                category="announcement",
            )
            count += 1

        log(actor=request.user, action="communication.broadcast_sent",
            changes={"audience": audience, "recipient_count": count}, request=request)
        return success(message=f"Sent to {count} recipient(s).", data={"recipient_count": count})
