from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView

from apps.audit.services import log
from apps.rbac.permissions import HasPermission
from common.responses import success

from .models import (
    Asset,
    InventoryItem,
    InventoryTransaction,
    JobApplication,
    JobPosting,
    LeaveRequest,
    StaffDocument,
)
from .serializers import (
    AssetSerializer,
    InventoryItemSerializer,
    InventoryTransactionSerializer,
    JobApplicationSerializer,
    JobPostingSerializer,
    LeaveRequestSerializer,
    StaffDocumentSerializer,
)


def _permission_mixin(module):
    class Mixin:
        write_action = "edit"

        def get_permissions(self):
            code = f"{module}.view" if self.request.method in ("GET", "HEAD", "OPTIONS") else f"{module}.{self.write_action}"
            return [HasPermission(code)]

    return Mixin


HRPermissionMixin = _permission_mixin("hr")
RecruitmentPermissionMixin = _permission_mixin("recruitment")
InventoryPermissionMixin = _permission_mixin("inventory")
AssetsPermissionMixin = _permission_mixin("assets")


# ================================================================ HR
class LeaveRequestsView(HRPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = LeaveRequestSerializer

    def get_queryset(self):
        qs = LeaveRequest.objects.select_related("staff", "reviewed_by")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        leave = serializer.save()
        log(actor=self.request.user, action="operations.leave_requested", target=leave, request=self.request)


class LeaveRequestDetailView(HRPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = LeaveRequestSerializer
    queryset = LeaveRequest.objects.all()
    lookup_url_kwarg = "leave_id"

    def perform_update(self, serializer):
        leave = serializer.save()
        log(actor=self.request.user, action="operations.leave_updated", target=leave, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="operations.leave_deleted", target=instance, request=self.request)
        instance.delete()


class LeaveRequestReviewView(APIView):
    permission_classes = [HasPermission("hr.approve")]

    def post(self, request, leave_id):
        leave = get_object_or_404(LeaveRequest, id=leave_id)
        outcome = request.data.get("status")
        if outcome not in (LeaveRequest.Status.APPROVED, LeaveRequest.Status.REJECTED):
            raise ValidationError({"status": ["Must be 'approved' or 'rejected'."]})
        leave.status = outcome
        leave.reviewed_by = request.user
        leave.reviewed_at = timezone.now()
        leave.save(update_fields=["status", "reviewed_by", "reviewed_at"])
        log(actor=request.user, action=f"operations.leave_{outcome}", target=leave, request=request)
        return success(message=f"Leave request {outcome}.", data=LeaveRequestSerializer(leave).data)


class StaffDocumentsView(HRPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = StaffDocumentSerializer

    def get_queryset(self):
        qs = StaffDocument.objects.select_related("staff", "uploaded_by")
        staff = self.request.query_params.get("staff")
        if staff:
            qs = qs.filter(staff_id=staff)
        return qs

    def perform_create(self, serializer):
        doc = serializer.save(uploaded_by=self.request.user)
        log(actor=self.request.user, action="operations.staff_document_uploaded", target=doc, request=self.request)


class StaffDocumentDetailView(HRPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = StaffDocumentSerializer
    queryset = StaffDocument.objects.all()
    lookup_url_kwarg = "document_id"

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="operations.staff_document_deleted", target=instance, request=self.request)
        instance.delete()


# ================================================================ Recruitment
class JobPostingsView(RecruitmentPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = JobPostingSerializer
    queryset = JobPosting.objects.select_related("department")

    def perform_create(self, serializer):
        posting = serializer.save()
        log(actor=self.request.user, action="operations.job_posting_created", target=posting, request=self.request)


class JobPostingDetailView(RecruitmentPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = JobPostingSerializer
    queryset = JobPosting.objects.all()
    lookup_url_kwarg = "posting_id"

    def perform_update(self, serializer):
        posting = serializer.save()
        log(actor=self.request.user, action="operations.job_posting_updated", target=posting, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="operations.job_posting_deleted", target=instance, request=self.request)
        instance.delete()


class JobApplicationsView(RecruitmentPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = JobApplicationSerializer

    def get_queryset(self):
        return JobApplication.objects.filter(posting_id=self.kwargs["posting_id"])

    def perform_create(self, serializer):
        application = serializer.save(posting_id=self.kwargs["posting_id"])
        log(actor=self.request.user, action="operations.job_application_received", target=application, request=self.request)


class JobApplicationDetailView(RecruitmentPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = JobApplicationSerializer
    queryset = JobApplication.objects.all()
    lookup_url_kwarg = "application_id"

    def perform_update(self, serializer):
        application = serializer.save()
        log(actor=self.request.user, action="operations.job_application_updated", target=application, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="operations.job_application_deleted", target=instance, request=self.request)
        instance.delete()


# ================================================================ Inventory
class InventoryItemsView(InventoryPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = InventoryItemSerializer
    queryset = InventoryItem.objects.all()
    search_fields = ["name", "category"]

    def perform_create(self, serializer):
        item = serializer.save()
        log(actor=self.request.user, action="operations.inventory_item_created", target=item, request=self.request)


class InventoryItemDetailView(InventoryPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = InventoryItemSerializer
    queryset = InventoryItem.objects.all()
    lookup_url_kwarg = "item_id"

    def perform_update(self, serializer):
        item = serializer.save()
        log(actor=self.request.user, action="operations.inventory_item_updated", target=item, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="operations.inventory_item_deleted", target=instance, request=self.request)
        instance.delete()


class InventoryTransactionsView(InventoryPermissionMixin, ListCreateAPIView):
    write_action = "edit"
    serializer_class = InventoryTransactionSerializer

    def get_queryset(self):
        return InventoryTransaction.objects.filter(item_id=self.kwargs["item_id"]).select_related("recorded_by")

    def perform_create(self, serializer):
        item = get_object_or_404(InventoryItem, id=self.kwargs["item_id"])
        transaction = serializer.save(item=item, recorded_by=self.request.user)
        if transaction.transaction_type == InventoryTransaction.TransactionType.IN:
            item.quantity += transaction.quantity
        else:
            if transaction.quantity > item.quantity:
                transaction.delete()
                raise ValidationError({"quantity": ["Cannot remove more than the current stock."]})
            item.quantity -= transaction.quantity
        item.save(update_fields=["quantity"])
        log(actor=self.request.user, action="operations.inventory_transaction_recorded", target=transaction, request=self.request)


# ================================================================ Assets
class AssetsView(AssetsPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = AssetSerializer
    queryset = Asset.objects.select_related("assigned_to")
    search_fields = ["name", "serial_number", "category"]

    def perform_create(self, serializer):
        asset = serializer.save()
        log(actor=self.request.user, action="operations.asset_created", target=asset, request=self.request)


class AssetDetailView(AssetsPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = AssetSerializer
    queryset = Asset.objects.all()
    lookup_url_kwarg = "asset_id"

    def perform_update(self, serializer):
        asset = serializer.save()
        log(actor=self.request.user, action="operations.asset_updated", target=asset, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="operations.asset_deleted", target=instance, request=self.request)
        instance.delete()
