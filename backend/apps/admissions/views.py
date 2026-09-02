from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from apps.audit.services import log
from apps.rbac.permissions import HasPermission
from apps.settings_app.models import SystemSetting
from apps.settings_app.numbering import generate_number
from common.responses import failure, success

from . import services
from .models import Application, ApplicationDocument
from .serializers import (
    ApplicationDocumentSerializer,
    ApplicationReviewSerializer,
    ApplicationSerializer,
    PublicApplicationConfigSerializer,
    PublicApplicationStatusSerializer,
    PublicApplicationSubmitSerializer,
)


# ---------------------------------------------------------------- Public
class ApplicationConfigView(APIView):
    """What the public apply form needs to know before rendering — mirrors
    the existing public /config/public-classes pattern."""

    permission_classes = [AllowAny]

    def get(self, request):
        setting = SystemSetting.objects.filter(key="student_admission.guardian_required").first()
        guardian_required = bool(setting.value) if setting else False
        window = services.get_admission_window()
        return success(data=PublicApplicationConfigSerializer({"guardian_required": guardian_required, **window}).data)


class ApplicationSubmitView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        window = services.get_admission_window()
        if not window["is_open"]:
            return failure(message=window["reason"] or "Applications are not currently being accepted.", status=403)

        data = dict(request.data)
        guardian_required_setting = SystemSetting.objects.filter(key="student_admission.guardian_required").first()
        if guardian_required_setting and guardian_required_setting.value:
            data["has_guardian"] = True

        serializer = PublicApplicationSubmitSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save(reference_number=generate_number("application"))
        log(actor=None, action="admissions.application_submitted", target=application,
            changes={"reference_number": application.reference_number}, request=request)
        return success(
            message="Application submitted.",
            data=PublicApplicationSubmitSerializer(application).data,
            status=201,
        )


class ApplicationDocumentsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, reference_number):
        application = get_object_or_404(Application, reference_number=reference_number)
        serializer = ApplicationDocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = serializer.save(application=application)
        return success(message="Document added.", data=ApplicationDocumentSerializer(document).data, status=201)


class ApplicationStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, reference_number):
        application = get_object_or_404(Application, reference_number=reference_number)
        return success(data=PublicApplicationStatusSerializer(application).data)


# ---------------------------------------------------------------- Super Admin review
class ApplicationsListView(ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [HasPermission("admissions.view")]
    search_fields = ["surname", "first_name", "middle_name", "reference_number", "email", "phone"]
    filterset_fields = ["status", "level", "class_applying_for"]

    def get_queryset(self):
        return Application.objects.select_related(
            "class_applying_for", "reviewed_by", "enrolled_student__user",
        ).prefetch_related("documents")


class ApplicationDetailView(RetrieveUpdateAPIView):
    serializer_class = ApplicationSerializer
    queryset = Application.objects.select_related(
        "class_applying_for", "reviewed_by", "enrolled_student__user",
    ).prefetch_related("documents")
    lookup_url_kwarg = "application_id"

    def get_permissions(self):
        code = "admissions.view" if self.request.method in ("GET", "HEAD", "OPTIONS") else "admissions.edit"
        return [HasPermission(code)]

    def perform_update(self, serializer):
        application = serializer.save()
        log(actor=self.request.user, action="admissions.application_updated", target=application, request=self.request)


class ApplicationReviewView(APIView):
    """Marks under_review or rejected. Accepting is a materially different
    action (creates portals, invoices, sends credentials) — see
    ApplicationAcceptView below."""

    permission_classes = [HasPermission("admissions.review")]

    def post(self, request, application_id):
        application = get_object_or_404(Application, id=application_id)
        serializer = ApplicationReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        status_value = serializer.validated_data["status"]
        notes = serializer.validated_data.get("review_notes", "")

        if status_value == Application.Status.REJECTED:
            services.reject_application(application, request.user, notes)
        else:
            application.status = status_value
            application.review_notes = notes or application.review_notes
            application.save(update_fields=["status", "review_notes"])

        log(actor=request.user, action=f"admissions.application_{application.status}", target=application, request=request)
        return success(message=f"Application {application.status}.", data=ApplicationSerializer(application).data)


class ApplicationAcceptView(APIView):
    permission_classes = [HasPermission("admissions.review")]

    def post(self, request, application_id):
        application = get_object_or_404(Application, id=application_id)
        if application.level != Application.Level.SECONDARY:
            return failure(message="Only secondary applications can be accepted through this workflow.", status=400)
        if application.status == Application.Status.REJECTED:
            return failure(message="This application was already rejected.", status=400)

        services.approve_application(application, request.user)
        log(actor=request.user, action="admissions.application_accepted", target=application, request=request)
        return success(message="Application accepted. Student and guardian portals provisioned.", data=ApplicationSerializer(application).data)
