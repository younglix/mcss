from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView

from apps.audit.services import log
from apps.rbac.permissions import HasPermission
from common.responses import success

from .models import VisitorLog
from .serializers import VisitorLogSerializer


class VisitorLogListView(ListCreateAPIView):
    serializer_class = VisitorLogSerializer
    queryset = VisitorLog.objects.all()
    filterset_fields = ["status"]
    search_fields = ["full_name", "phone", "person_to_see"]

    def get_permissions(self):
        code = "reception.view" if self.request.method == "GET" else "reception.create"
        return [HasPermission(code)]

    def perform_create(self, serializer):
        visitor = serializer.save()
        log(actor=self.request.user, action="reception.visitor_checked_in", target=visitor, request=self.request)


class VisitorLogDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = VisitorLogSerializer
    queryset = VisitorLog.objects.all()

    def get_permissions(self):
        mapping = {"GET": "reception.view", "PATCH": "reception.edit", "PUT": "reception.edit", "DELETE": "reception.delete"}
        return [HasPermission(mapping[self.request.method])]

    def perform_update(self, serializer):
        visitor = serializer.save()
        log(actor=self.request.user, action="reception.visitor_updated", target=visitor, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="reception.visitor_deleted", target=instance, request=self.request)
        instance.delete()


class VisitorCheckOutView(APIView):
    permission_classes = [HasPermission("reception.edit")]

    def post(self, request, visitor_id):
        visitor = get_object_or_404(VisitorLog, id=visitor_id)
        visitor.status = VisitorLog.Status.CHECKED_OUT
        visitor.checked_out_at = timezone.now()
        visitor.save(update_fields=["status", "checked_out_at"])
        log(actor=request.user, action="reception.visitor_checked_out", target=visitor, request=request)
        return success(message="Visitor checked out.", data=VisitorLogSerializer(visitor).data)
