from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers
from rest_framework.filters import OrderingFilter
from rest_framework.generics import ListAPIView

from apps.rbac.permissions import HasPermission

from .models import AuditLog, LoginHistory


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.full_name", default=None, read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id", "actor", "actor_name", "action", "target_type", "target_id",
            "changes", "ip_address", "user_agent", "created_at",
        ]
        read_only_fields = fields


class LoginHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginHistory
        fields = ["id", "user", "successful", "ip_address", "user_agent", "created_at"]
        read_only_fields = fields


class AuditLogListView(ListAPIView):
    permission_classes = [HasPermission("audit.view")]
    serializer_class = AuditLogSerializer
    queryset = AuditLog.objects.select_related("actor").all()
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["actor", "action", "target_type"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]


class LoginHistoryListView(ListAPIView):
    permission_classes = [HasPermission("audit.view")]
    serializer_class = LoginHistorySerializer
    queryset = LoginHistory.objects.select_related("user").all()
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["user", "successful"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]
