from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import AllowAny
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


class PublicClassOptionsView(APIView):
    """Unauthenticated — just id+name, for the public admission form's
    'class applying for' picker. Nothing else about a class is exposed here."""

    permission_classes = [AllowAny]

    def get(self, request):
        classes = SchoolClass.objects.order_by("level_order").values("id", "name")
        return success(data=list(classes))


class SessionsView(ConfigPermissionMixin, ListCreateAPIView):
    serializer_class = AcademicSessionSerializer
    queryset = AcademicSession.objects.all()

    def perform_create(self, serializer):
        session = serializer.save()
        log(actor=self.request.user, action="config.session_created", target=session, request=self.request)


class SessionDetailView(ConfigPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = AcademicSessionSerializer
    queryset = AcademicSession.objects.all()
    lookup_url_kwarg = "session_id"

    def perform_update(self, serializer):
        session = serializer.save()
        log(actor=self.request.user, action="config.session_updated", target=session, request=self.request)

    def perform_destroy(self, instance):
        if instance.is_current:
            raise ValidationError("Cannot delete the current academic session. Set another session as current first.")
        log(actor=self.request.user, action="config.session_deleted", target=instance, request=self.request)
        instance.delete()


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


class TermDetailView(ConfigPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = TermSerializer
    queryset = Term.objects.all()
    lookup_url_kwarg = "term_id"

    def perform_update(self, serializer):
        term = serializer.save()
        log(actor=self.request.user, action="config.term_updated", target=term, request=self.request)

    def perform_destroy(self, instance):
        if instance.is_current:
            raise ValidationError("Cannot delete the current term. Set another term as current first.")
        log(actor=self.request.user, action="config.term_deleted", target=instance, request=self.request)
        instance.delete()


class TermSetCurrentView(ConfigPermissionMixin, APIView):
    def post(self, request, term_id):
        term = services.set_current_term(term_id)
        log(actor=request.user, action="config.term_set_current", target=term, request=request)
        return success(message="Current term updated.", data=TermSerializer(term).data)


class ClassesView(ConfigPermissionMixin, ListCreateAPIView):
    serializer_class = SchoolClassSerializer
    queryset = SchoolClass.objects.prefetch_related("arms").all()

    def perform_create(self, serializer):
        klass = serializer.save()
        log(actor=self.request.user, action="config.class_created", target=klass, request=self.request)


class ClassDetailView(ConfigPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = SchoolClassSerializer
    queryset = SchoolClass.objects.prefetch_related("arms").all()
    lookup_url_kwarg = "class_id"

    def perform_update(self, serializer):
        klass = serializer.save()
        log(actor=self.request.user, action="config.class_updated", target=klass, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="config.class_deleted", target=instance, request=self.request)
        instance.delete()


class ClassArmsView(ConfigPermissionMixin, ListCreateAPIView):
    serializer_class = ClassArmSerializer

    def get_queryset(self):
        return ClassArm.objects.filter(school_class_id=self.kwargs["class_id"])

    def perform_create(self, serializer):
        arm = serializer.save(school_class_id=self.kwargs["class_id"])
        log(actor=self.request.user, action="config.class_arm_created", target=arm, request=self.request)


class ClassArmDetailView(ConfigPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = ClassArmSerializer
    queryset = ClassArm.objects.all()
    lookup_url_kwarg = "arm_id"

    def perform_update(self, serializer):
        arm = serializer.save()
        log(actor=self.request.user, action="config.class_arm_updated", target=arm, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="config.class_arm_deleted", target=instance, request=self.request)
        instance.delete()


class DepartmentsView(ConfigPermissionMixin, ListCreateAPIView):
    serializer_class = DepartmentSerializer
    queryset = Department.objects.all()

    def perform_create(self, serializer):
        department = serializer.save()
        log(actor=self.request.user, action="config.department_created", target=department, request=self.request)


class DepartmentDetailView(ConfigPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = DepartmentSerializer
    queryset = Department.objects.all()
    lookup_url_kwarg = "department_id"

    def perform_update(self, serializer):
        department = serializer.save()
        log(actor=self.request.user, action="config.department_updated", target=department, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="config.department_deleted", target=instance, request=self.request)
        instance.delete()


class GradeScalesView(ConfigPermissionMixin, ListCreateAPIView):
    serializer_class = GradeScaleSerializer
    queryset = GradeScale.objects.all()

    def perform_create(self, serializer):
        grade = serializer.save()
        log(actor=self.request.user, action="config.grade_scale_created", target=grade, request=self.request)


class GradeScaleDetailView(ConfigPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = GradeScaleSerializer
    queryset = GradeScale.objects.all()
    lookup_url_kwarg = "grade_scale_id"

    def perform_update(self, serializer):
        grade = serializer.save()
        log(actor=self.request.user, action="config.grade_scale_updated", target=grade, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="config.grade_scale_deleted", target=instance, request=self.request)
        instance.delete()


class FeeCategoriesView(ConfigPermissionMixin, ListCreateAPIView):
    serializer_class = FeeCategorySerializer
    queryset = FeeCategory.objects.all()

    def perform_create(self, serializer):
        category = serializer.save()
        log(actor=self.request.user, action="config.fee_category_created", target=category, request=self.request)


class FeeCategoryDetailView(ConfigPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = FeeCategorySerializer
    queryset = FeeCategory.objects.all()
    lookup_url_kwarg = "fee_category_id"

    def perform_update(self, serializer):
        category = serializer.save()
        log(actor=self.request.user, action="config.fee_category_updated", target=category, request=self.request)

    def perform_destroy(self, instance):
        if instance.fee_structures.exists():
            raise ValidationError("Can't delete a fee item that's already used in a fee structure. Remove those first.")
        log(actor=self.request.user, action="config.fee_category_deleted", target=instance, request=self.request)
        instance.delete()
