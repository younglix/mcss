from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.generics import ListAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from apps.audit.services import log
from apps.rbac.permissions import HasPermission
from apps.settings_app.numbering import generate_number
from common.responses import success

from .models import Application, ApplicationDocument
from .serializers import (
    ApplicationDocumentSerializer,
    ApplicationReviewSerializer,
    ApplicationSerializer,
    PublicApplicationStatusSerializer,
    PublicApplicationSubmitSerializer,
)


# ---------------------------------------------------------------- Public
class ApplicationSubmitView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PublicApplicationSubmitSerializer(data=request.data)
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
    search_fields = ["full_name", "reference_number", "email", "phone"]
    filterset_fields = ["status", "class_applying_for"]

    def get_queryset(self):
        return Application.objects.select_related("class_applying_for", "reviewed_by").prefetch_related("documents")


class ApplicationDetailView(RetrieveUpdateAPIView):
    serializer_class = ApplicationSerializer
    queryset = Application.objects.select_related("class_applying_for", "reviewed_by").prefetch_related("documents")
    lookup_url_kwarg = "application_id"

    def get_permissions(self):
        code = "admissions.view" if self.request.method in ("GET", "HEAD", "OPTIONS") else "admissions.edit"
        return [HasPermission(code)]

    def perform_update(self, serializer):
        application = serializer.save()
        log(actor=self.request.user, action="admissions.application_updated", target=application, request=self.request)


class ApplicationReviewView(APIView):
    permission_classes = [HasPermission("admissions.review")]

    def post(self, request, application_id):
        application = get_object_or_404(Application, id=application_id)
        serializer = ApplicationReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application.status = serializer.validated_data["status"]
        application.review_notes = serializer.validated_data.get("review_notes", application.review_notes)
        application.reviewed_by = request.user
        application.reviewed_at = timezone.now()
        application.save(update_fields=["status", "review_notes", "reviewed_by", "reviewed_at"])
        log(actor=request.user, action=f"admissions.application_{application.status}", target=application, request=request)
        return success(message=f"Application {application.status}.", data=ApplicationSerializer(application).data)
