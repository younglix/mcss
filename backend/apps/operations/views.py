import uuid
from datetime import timedelta
from pathlib import Path

from django.conf import settings as django_settings
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.audit.services import log
from apps.rbac.permissions import HasPermission
from common.responses import failure, success

from .models import (
    Asset,
    InventoryItem,
    InventoryTransaction,
    JobApplication,
    JobPosting,
    LeaveRequest,
    PerformanceReview,
    StaffAttendance,
    StaffContract,
    StaffDocument,
)
from .serializers import (
    AssetSerializer,
    InventoryItemSerializer,
    InventoryTransactionSerializer,
    JobApplicationSerializer,
    JobPostingSerializer,
    LeaveRequestSerializer,
    PerformanceReviewSerializer,
    StaffAttendanceSerializer,
    StaffContractSerializer,
    StaffDocumentSerializer,
)


User = get_user_model()


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
StaffAttendancePermissionMixin = _permission_mixin("staff_attendance")
ContractsPermissionMixin = _permission_mixin("contracts")
PerformancePermissionMixin = _permission_mixin("performance")


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


class HRFileUploadView(APIView):
    """Raw file upload backing Staff Documents and Contracts — same storage
    plumbing as settings_app.AssetUploadView / the Teacher Portal's
    resource uploader (S3 when configured, local disk only in DEBUG), open
    to any file type since employment contracts and certificates are
    commonly PDFs and documents, not images."""

    permission_classes = [HasPermission("hr.create")]
    MAX_BYTES = 15 * 1024 * 1024

    def post(self, request):
        if not django_settings.DEBUG and not django_settings.S3_CONFIGURED:
            return failure(message="File storage isn't configured yet. Add S3 credentials to enable uploads.", status=503)
        file = request.FILES.get("file")
        if not file:
            return failure(message="No file provided.", status=400)
        if file.size > self.MAX_BYTES:
            return failure(message="File must be smaller than 15MB.", status=400)
        ext = Path(file.name).suffix.lower() or ".bin"
        saved_path = default_storage.save(f"hr/{uuid.uuid4().hex}{ext}", file)
        url = default_storage.url(saved_path)
        log(actor=request.user, action="operations.hr_file_uploaded", changes={"path": saved_path}, request=request)
        return success(data={"url": url, "file_name": file.name})


# ================================================================ Staff Attendance
class StaffAttendanceView(StaffAttendancePermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = StaffAttendanceSerializer

    def get_queryset(self):
        qs = StaffAttendance.objects.select_related("staff", "recorded_by")
        staff = self.request.query_params.get("staff")
        date = self.request.query_params.get("date")
        if staff:
            qs = qs.filter(staff_id=staff)
        if date:
            qs = qs.filter(date=date)
        return qs

    def perform_create(self, serializer):
        record = serializer.save(recorded_by=self.request.user)
        log(actor=self.request.user, action="operations.staff_attendance_recorded", target=record, request=self.request)


class StaffAttendanceDetailView(StaffAttendancePermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = StaffAttendanceSerializer
    queryset = StaffAttendance.objects.all()
    lookup_url_kwarg = "record_id"

    def perform_update(self, serializer):
        record = serializer.save()
        log(actor=self.request.user, action="operations.staff_attendance_updated", target=record, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="operations.staff_attendance_deleted", target=instance, request=self.request)
        instance.delete()


# ================================================================ Contracts
class StaffContractsView(ContractsPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = StaffContractSerializer

    def get_queryset(self):
        qs = StaffContract.objects.select_related("staff", "created_by")
        staff = self.request.query_params.get("staff")
        if staff:
            qs = qs.filter(staff_id=staff)
        return qs

    def perform_create(self, serializer):
        contract = serializer.save(created_by=self.request.user)
        log(actor=self.request.user, action="operations.staff_contract_created", target=contract, request=self.request)


class StaffContractDetailView(ContractsPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = StaffContractSerializer
    queryset = StaffContract.objects.all()
    lookup_url_kwarg = "contract_id"

    def perform_update(self, serializer):
        contract = serializer.save()
        log(actor=self.request.user, action="operations.staff_contract_updated", target=contract, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="operations.staff_contract_deleted", target=instance, request=self.request)
        instance.delete()


# ================================================================ Performance
class PerformanceReviewsView(PerformancePermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = PerformanceReviewSerializer

    def get_queryset(self):
        qs = PerformanceReview.objects.select_related("staff", "reviewer")
        staff = self.request.query_params.get("staff")
        if staff:
            qs = qs.filter(staff_id=staff)
        return qs

    def perform_create(self, serializer):
        review = serializer.save(reviewer=self.request.user)
        log(actor=self.request.user, action="operations.performance_review_created", target=review, request=self.request)


class PerformanceReviewDetailView(PerformancePermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = PerformanceReviewSerializer
    queryset = PerformanceReview.objects.all()
    lookup_url_kwarg = "review_id"

    def perform_update(self, serializer):
        review = serializer.save()
        log(actor=self.request.user, action="operations.performance_review_updated", target=review, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="operations.performance_review_deleted", target=instance, request=self.request)
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


# ================================================================ HR Portal
class HRDashboardView(APIView):
    """HR Portal > Dashboard: total staff, on leave today, new hires this
    month, and what's waiting on HR's attention."""

    permission_classes = [HasPermission("hr.view")]

    def get(self, request):
        today = timezone.localdate()
        month_ago = today - timedelta(days=30)

        total_staff = User.objects.filter(user_type=User.UserType.STAFF, is_deleted=False, is_active=True).count()
        on_leave_today = LeaveRequest.objects.filter(
            status=LeaveRequest.Status.APPROVED, start_date__lte=today, end_date__gte=today,
        ).count()
        new_hires = User.objects.filter(
            user_type=User.UserType.STAFF, is_deleted=False, created_at__date__gte=month_ago,
        ).count()
        pending_leave = LeaveRequest.objects.filter(status=LeaveRequest.Status.PENDING).count()
        pending_applications = JobApplication.objects.exclude(
            status__in=[JobApplication.Status.REJECTED, JobApplication.Status.HIRED],
        ).count()
        contracts_expiring_soon = StaffContract.objects.filter(
            status=StaffContract.Status.ACTIVE, end_date__isnull=False,
            end_date__gte=today, end_date__lte=today + timedelta(days=30),
        ).count()

        recent_leave = LeaveRequest.objects.filter(status=LeaveRequest.Status.PENDING).select_related("staff").order_by("-created_at")[:5]

        return success(data={
            "total_staff": total_staff,
            "on_leave_today": on_leave_today,
            "new_hires_30d": new_hires,
            "pending_leave_requests": pending_leave,
            "pending_applications": pending_applications,
            "contracts_expiring_soon": contracts_expiring_soon,
            "recent_pending_leave": LeaveRequestSerializer(recent_leave, many=True).data,
        })


class HRReportsView(APIView):
    """HR Portal > Staff Reports: headcount by department, leave taken,
    recruitment pipeline, and contracts approaching expiry."""

    permission_classes = [HasPermission("reports.view")]

    def get(self, request):
        today = timezone.localdate()

        # No direct User -> Department link exists (Department only relates
        # to Subject and JobPosting today) — role is the real structural
        # grouping staff accounts actually carry, so that's what headcount
        # breaks down by rather than a department field that isn't there.
        headcount_by_role = list(
            User.objects.filter(user_type=User.UserType.STAFF, is_deleted=False, is_active=True)
            .values("user_roles__role__name")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        leave_by_type = list(
            LeaveRequest.objects.filter(status=LeaveRequest.Status.APPROVED)
            .values("leave_type").annotate(count=Count("id")).order_by("-count")
        )
        applications_by_status = list(
            JobApplication.objects.values("status").annotate(count=Count("id")).order_by("-count")
        )
        expiring_contracts = list(
            StaffContract.objects.filter(
                status=StaffContract.Status.ACTIVE, end_date__isnull=False,
                end_date__gte=today, end_date__lte=today + timedelta(days=60),
            ).select_related("staff").order_by("end_date").values(
                "staff__full_name", "end_date", "contract_type",
            )
        )

        return success(data={
            "total_staff": User.objects.filter(user_type=User.UserType.STAFF, is_deleted=False, is_active=True).count(),
            "headcount_by_role": [
                {"role": r["user_roles__role__name"] or "Unassigned", "count": r["count"]} for r in headcount_by_role
            ],
            "leave_by_type": [{"leave_type": r["leave_type"], "count": r["count"]} for r in leave_by_type],
            "applications_by_status": [{"status": r["status"], "count": r["count"]} for r in applications_by_status],
            "expiring_contracts": [
                {"staff_name": r["staff__full_name"], "end_date": r["end_date"], "contract_type": r["contract_type"]}
                for r in expiring_contracts
            ],
        })
