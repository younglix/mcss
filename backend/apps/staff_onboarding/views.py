from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from apps.audit.services import log
from apps.rbac.permissions import HasPermission
from common.responses import failure, success

from . import services
from .models import StaffApplication
from .serializers import (
    PublicStaffApplicationSubmitSerializer,
    StaffApplicationReviewSerializer,
    StaffApplicationSerializer,
)


# ---------------------------------------------------------------- Public
class StaffApplicationConfigView(APIView):
    """Everything the public "create my staff account" form needs to render
    its dropdowns — the staff-type list, every real subject, and every real
    class-arm (for subject claims and the form-teacher pick)."""

    permission_classes = [AllowAny]

    def get(self, request):
        from apps.academics.models import Subject
        from apps.configuration.models import ClassArm

        staff_types = [{"value": v, "label": l} for v, l in StaffApplication.StaffType.choices]
        subjects = [{"id": str(s.id), "name": s.name} for s in Subject.objects.filter(is_deleted=False).order_by("name")]
        class_arms = [
            {"id": str(a.id), "name": f"{a.school_class.name} {a.name}"}
            for a in ClassArm.objects.filter(is_deleted=False).select_related("school_class")
            .order_by("school_class__level_order", "name")
        ]
        return success(data={"staff_types": staff_types, "subjects": subjects, "class_arms": class_arms})


class StaffApplicationSubmitView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PublicStaffApplicationSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        log(actor=None, action="staff_onboarding.application_submitted", target=application, request=request)
        return success(
            message="Application submitted. The school will review it shortly.",
            data={"id": str(application.id)},
            status=201,
        )


# ---------------------------------------------------------------- HR / Super Admin review
class StaffApplicationsListView(ListAPIView):
    serializer_class = StaffApplicationSerializer
    permission_classes = [HasPermission("staff_applications.view")]
    search_fields = ["full_name", "email", "phone"]
    filterset_fields = ["status", "staff_type"]

    def get_queryset(self):
        return StaffApplication.objects.select_related(
            "reviewed_by", "form_teacher_class_arm__school_class", "created_user", "created_payout",
        ).prefetch_related("subject_claims__subject", "subject_claims__class_arm__school_class")


class StaffApplicationDetailView(RetrieveUpdateAPIView):
    serializer_class = StaffApplicationSerializer
    queryset = StaffApplication.objects.select_related(
        "reviewed_by", "form_teacher_class_arm__school_class", "created_user", "created_payout",
    ).prefetch_related("subject_claims__subject", "subject_claims__class_arm__school_class")
    lookup_url_kwarg = "application_id"

    def get_permissions(self):
        code = "staff_applications.view" if self.request.method in ("GET", "HEAD", "OPTIONS") else "staff_applications.edit"
        return [HasPermission(code)]

    def perform_update(self, serializer):
        application = serializer.save()
        log(actor=self.request.user, action="staff_onboarding.application_updated", target=application, request=self.request)


class StaffApplicationReviewView(APIView):
    """Marks under_review or rejected. Approving is a materially different
    action (creates the real account/role/assignments or payout record) —
    see StaffApplicationApproveView below."""

    permission_classes = [HasPermission("staff_applications.review")]

    def post(self, request, application_id):
        application = get_object_or_404(StaffApplication, id=application_id)
        serializer = StaffApplicationReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        status_value = serializer.validated_data["status"]
        notes = serializer.validated_data.get("review_notes", "")

        if status_value == StaffApplication.Status.REJECTED:
            services.reject_staff_application(application, request.user, notes)
        else:
            application.status = status_value
            application.review_notes = notes or application.review_notes
            application.save(update_fields=["status", "review_notes"])

        log(actor=request.user, action=f"staff_onboarding.application_{application.status}", target=application, request=request)
        return success(message=f"Application {application.status}.", data=StaffApplicationSerializer(application).data)


class StaffApplicationApproveView(APIView):
    permission_classes = [HasPermission("staff_applications.review")]

    def post(self, request, application_id):
        application = get_object_or_404(StaffApplication, id=application_id)
        if application.status == StaffApplication.Status.REJECTED:
            return failure(message="This application was already rejected.", status=400)

        services.approve_staff_application(application, request.user)
        log(actor=request.user, action="staff_onboarding.application_approved", target=application, request=request)
        return success(message="Application approved and the real staff record was created.", data=StaffApplicationSerializer(application).data)
