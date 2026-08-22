from django.shortcuts import get_object_or_404
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView
from rest_framework.views import APIView

from apps.audit.services import log
from apps.rbac.permissions import HasPermission
from common.responses import failure, success

from . import services
from .models import AcademicSession, ClassArm, Department, FeeCategory, GradeScale, SchoolClass, SchoolProfile, Term
from .serializers import (
    AcademicSessionSerializer,
    ClassArmSerializer,
    DepartmentSerializer,
    FeeCategorySerializer,
    GradeScaleSerializer,
    SchoolClassSerializer,
    SchoolProfileSerializer,
    TermSerializer,
)


class ConfigPermissionMixin:
    def get_permissions(self):
        code = "config.view" if self.request.method in ("GET", "HEAD", "OPTIONS") else "config.edit"
        return [HasPermission(code)]


class SchoolProfileView(ConfigPermissionMixin, APIView):
    def get(self, request):
        profile = SchoolProfile.objects.first() or SchoolProfile.objects.create(name="Mount Carmel Secondary School")
        return success(data=SchoolProfileSerializer(profile).data)

    def patch(self, request):
        profile = SchoolProfile.objects.first() or SchoolProfile.objects.create(name="Mount Carmel Secondary School")
        serializer = SchoolProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log(actor=request.user, action="config.school_profile_updated", target=profile, request=request)
        return success(message="School profile updated.", data=serializer.data)


class SessionsView(ConfigPermissionMixin, ListCreateAPIView):
    serializer_class = AcademicSessionSerializer
    queryset = AcademicSession.objects.all()

    def perform_create(self, serializer):
        session = serializer.save()
        log(actor=self.request.user, action="config.session_created", target=session, request=self.request)


class SessionSetCurrentView(ConfigPermissionMixin, APIView):
    def post(self, request, session_id):
        session = services.set_current_session(session_id)
        log(actor=request.user, action="config.session_set_current", target=session, request=request)
        return success(message="Current session updated.", data=AcademicSessionSerializer(session).data)


class SessionTermsView(ConfigPermissionMixin, ListCreateAPIView):
    serializer_class = TermSerializer

    def get_queryset(self):
        return Term.objects.filter(session_id=self.kwargs["session_id"])

    def perform_create(self, serializer):
        term = serializer.save(session_id=self.kwargs["session_id"])
        log(actor=self.request.user, action="config.term_created", target=term, request=self.request)


class TermSetCurrentView(ConfigPermissionMixin, APIView):
    def post(self, request, term_id):
        term = services.set_current_term(term_id)
        log(actor=request.user, action="config.term_set_current", target=term, request=request)
        return success(message="Current term updated.", data=TermSerializer(term).data)


class ClassesView(ConfigPermissionMixin, ListCreateAPIView):
    serializer_class = SchoolClassSerializer
    queryset = SchoolClass.objects.prefetch_related("arms").all()


class ClassArmsView(ConfigPermissionMixin, ListCreateAPIView):
    serializer_class = ClassArmSerializer

    def get_queryset(self):
        return ClassArm.objects.filter(school_class_id=self.kwargs["class_id"])

    def perform_create(self, serializer):
        serializer.save(school_class_id=self.kwargs["class_id"])


class DepartmentsView(ConfigPermissionMixin, ListCreateAPIView):
    serializer_class = DepartmentSerializer
    queryset = Department.objects.all()


class GradeScalesView(ConfigPermissionMixin, ListCreateAPIView):
    serializer_class = GradeScaleSerializer
    queryset = GradeScale.objects.all()


class FeeCategoriesView(ConfigPermissionMixin, ListCreateAPIView):
    serializer_class = FeeCategorySerializer
    queryset = FeeCategory.objects.all()
