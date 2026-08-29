import uuid
from pathlib import Path

from django.conf import settings as django_settings
from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.academics.models import ClassSubjectAssignment, ClassTeacherAssignment, Student
from apps.audit.services import log
from apps.configuration.models import AcademicSession
from apps.rbac.permissions import HasPermission
from common.responses import failure, success

from .models import (
    Activity,
    ActivityParticipant,
    Book,
    BookLoan,
    DisciplineRecord,
    HealthIncident,
    HealthRecord,
    HostelAllocation,
    HostelBlock,
    HostelRoom,
    MealMenu,
    StudentResource,
    TransportAssignment,
    TransportRoute,
    Vehicle,
)
from .serializers import (
    ActivityParticipantSerializer,
    ActivitySerializer,
    BookLoanSerializer,
    BookSerializer,
    DisciplineRecordSerializer,
    HealthIncidentSerializer,
    HealthRecordSerializer,
    HostelAllocationSerializer,
    HostelBlockSerializer,
    HostelRoomSerializer,
    MealMenuSerializer,
    StudentResourceSerializer,
    TransportAssignmentSerializer,
    TransportRouteSerializer,
    VehicleSerializer,
)


def _current_session():
    return AcademicSession.objects.filter(is_current=True).first()


def _child_or_403(request, student_id):
    """Same ownership guard as apps.finance._child_or_403/apps.academics._child_or_403."""
    student = get_object_or_404(Student, id=student_id)
    if student.guardian_user_id != request.user.id:
        return None
    return student


def _permission_mixin(module):
    class Mixin:
        write_action = "edit"

        def get_permissions(self):
            code = f"{module}.view" if self.request.method in ("GET", "HEAD", "OPTIONS") else f"{module}.{self.write_action}"
            return [HasPermission(code)]

    return Mixin


LibraryPermissionMixin = _permission_mixin("library")
HostelPermissionMixin = _permission_mixin("hostel")
TransportPermissionMixin = _permission_mixin("transport")
MessPermissionMixin = _permission_mixin("mess")
ActivitiesPermissionMixin = _permission_mixin("activities")
ResourcesPermissionMixin = _permission_mixin("resources")
HealthPermissionMixin = _permission_mixin("health")
DisciplinePermissionMixin = _permission_mixin("discipline")


# ================================================================ Library
class BooksView(LibraryPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = BookSerializer
    queryset = Book.objects.all()
    search_fields = ["title", "author", "isbn"]

    def perform_create(self, serializer):
        book = serializer.save()
        log(actor=self.request.user, action="student_services.book_created", target=book, request=self.request)


class BookDetailView(LibraryPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = BookSerializer
    queryset = Book.objects.all()
    lookup_url_kwarg = "book_id"

    def perform_update(self, serializer):
        book = serializer.save()
        log(actor=self.request.user, action="student_services.book_updated", target=book, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="student_services.book_deleted", target=instance, request=self.request)
        instance.delete()


class BookLoansView(LibraryPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = BookLoanSerializer

    def get_queryset(self):
        qs = BookLoan.objects.select_related("book", "borrower")
        outstanding = self.request.query_params.get("outstanding")
        if outstanding == "true":
            qs = qs.filter(returned_at__isnull=True)
        return qs

    def perform_create(self, serializer):
        loan = serializer.save()
        book = loan.book
        book.available_copies = max(0, book.available_copies - 1)
        book.save(update_fields=["available_copies"])
        log(actor=self.request.user, action="student_services.book_checked_out", target=loan, request=self.request)


class BookLoanReturnView(APIView):
    permission_classes = [HasPermission("library.edit")]

    def post(self, request, loan_id):
        loan = get_object_or_404(BookLoan, id=loan_id)
        if loan.returned_at:
            raise ValidationError("This loan has already been returned.")
        loan.returned_at = timezone.now().date()
        loan.save(update_fields=["returned_at"])
        book = loan.book
        book.available_copies = min(book.total_copies, book.available_copies + 1)
        book.save(update_fields=["available_copies"])
        log(actor=request.user, action="student_services.book_returned", target=loan, request=request)
        return success(message="Book returned.", data=BookLoanSerializer(loan).data)


class MyBookLoansView(APIView):
    """Student Portal > Library: the logged-in student's own borrowed-book
    history. BookLoan.borrower is a plain accounts.User FK (not Student), so
    this filters directly on request.user rather than a student_profile."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = BookLoan.objects.filter(borrower=request.user).select_related("book")
        return success(data=BookLoanSerializer(qs, many=True).data)


class ChildBookLoansView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        student = _child_or_403(request, student_id)
        if student is None:
            return failure(message="Not your child's record.", status=403)
        qs = BookLoan.objects.filter(borrower=student.user).select_related("book")
        return success(data=BookLoanSerializer(qs, many=True).data)


# ================================================================ Hostel
class HostelBlocksView(HostelPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = HostelBlockSerializer
    queryset = HostelBlock.objects.prefetch_related("rooms__allocations")

    def perform_create(self, serializer):
        block = serializer.save()
        log(actor=self.request.user, action="student_services.hostel_block_created", target=block, request=self.request)


class HostelBlockDetailView(HostelPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = HostelBlockSerializer
    queryset = HostelBlock.objects.all()
    lookup_url_kwarg = "block_id"

    def perform_update(self, serializer):
        block = serializer.save()
        log(actor=self.request.user, action="student_services.hostel_block_updated", target=block, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="student_services.hostel_block_deleted", target=instance, request=self.request)
        instance.delete()


class HostelRoomsView(HostelPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = HostelRoomSerializer

    def get_queryset(self):
        return HostelRoom.objects.filter(block_id=self.kwargs["block_id"])

    def perform_create(self, serializer):
        room = serializer.save(block_id=self.kwargs["block_id"])
        log(actor=self.request.user, action="student_services.hostel_room_created", target=room, request=self.request)


class HostelRoomDetailView(HostelPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = HostelRoomSerializer
    queryset = HostelRoom.objects.all()
    lookup_url_kwarg = "room_id"

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="student_services.hostel_room_deleted", target=instance, request=self.request)
        instance.delete()


class HostelAllocationsView(HostelPermissionMixin, ListCreateAPIView):
    write_action = "allocate"
    serializer_class = HostelAllocationSerializer

    def get_queryset(self):
        qs = HostelAllocation.objects.select_related("student__user", "room__block")
        room = self.request.query_params.get("room")
        active_only = self.request.query_params.get("active")
        if room:
            qs = qs.filter(room_id=room)
        if active_only == "true":
            qs = qs.filter(vacated_at__isnull=True)
        return qs

    def perform_create(self, serializer):
        session = _current_session()
        if not session:
            raise ValidationError("No current academic session is set.")
        allocation = serializer.save(session=session)
        log(actor=self.request.user, action="student_services.hostel_allocated", target=allocation, request=self.request)


class HostelVacateView(APIView):
    permission_classes = [HasPermission("hostel.allocate")]

    def post(self, request, allocation_id):
        allocation = get_object_or_404(HostelAllocation, id=allocation_id)
        if allocation.vacated_at:
            raise ValidationError("This allocation has already been vacated.")
        allocation.vacated_at = timezone.now().date()
        allocation.save(update_fields=["vacated_at"])
        log(actor=request.user, action="student_services.hostel_vacated", target=allocation, request=request)
        return success(message="Room vacated.", data=HostelAllocationSerializer(allocation).data)


class MyHostelView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = getattr(request.user, "student_profile", None)
        if student is None:
            return failure(message="No student profile on this account.", status=403)
        qs = HostelAllocation.objects.filter(student=student).select_related("room__block")
        return success(data=HostelAllocationSerializer(qs, many=True).data)


class ChildHostelView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        student = _child_or_403(request, student_id)
        if student is None:
            return failure(message="Not your child's record.", status=403)
        qs = HostelAllocation.objects.filter(student=student).select_related("room__block")
        return success(data=HostelAllocationSerializer(qs, many=True).data)


# ================================================================ Transport
class TransportRoutesView(TransportPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = TransportRouteSerializer
    queryset = TransportRoute.objects.all()

    def perform_create(self, serializer):
        route = serializer.save()
        log(actor=self.request.user, action="student_services.transport_route_created", target=route, request=self.request)


class TransportRouteDetailView(TransportPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = TransportRouteSerializer
    queryset = TransportRoute.objects.all()
    lookup_url_kwarg = "route_id"

    def perform_update(self, serializer):
        route = serializer.save()
        log(actor=self.request.user, action="student_services.transport_route_updated", target=route, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="student_services.transport_route_deleted", target=instance, request=self.request)
        instance.delete()


class VehiclesView(TransportPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = VehicleSerializer
    queryset = Vehicle.objects.select_related("route")

    def perform_create(self, serializer):
        vehicle = serializer.save()
        log(actor=self.request.user, action="student_services.vehicle_created", target=vehicle, request=self.request)


class VehicleDetailView(TransportPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = VehicleSerializer
    queryset = Vehicle.objects.all()
    lookup_url_kwarg = "vehicle_id"

    def perform_update(self, serializer):
        vehicle = serializer.save()
        log(actor=self.request.user, action="student_services.vehicle_updated", target=vehicle, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="student_services.vehicle_deleted", target=instance, request=self.request)
        instance.delete()


class TransportAssignmentsView(TransportPermissionMixin, ListCreateAPIView):
    write_action = "assign"
    serializer_class = TransportAssignmentSerializer

    def get_queryset(self):
        qs = TransportAssignment.objects.select_related("student__user", "route")
        route = self.request.query_params.get("route")
        if route:
            qs = qs.filter(route_id=route)
        return qs

    def perform_create(self, serializer):
        assignment = serializer.save()
        log(actor=self.request.user, action="student_services.transport_assigned", target=assignment, request=self.request)


class TransportAssignmentDetailView(TransportPermissionMixin, RetrieveUpdateDestroyAPIView):
    write_action = "assign"
    serializer_class = TransportAssignmentSerializer
    queryset = TransportAssignment.objects.all()
    lookup_url_kwarg = "assignment_id"

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="student_services.transport_unassigned", target=instance, request=self.request)
        instance.delete()


class MyTransportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = getattr(request.user, "student_profile", None)
        if student is None:
            return failure(message="No student profile on this account.", status=403)
        qs = TransportAssignment.objects.filter(student=student).select_related("route")
        return success(data=TransportAssignmentSerializer(qs, many=True).data)


class ChildTransportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        student = _child_or_403(request, student_id)
        if student is None:
            return failure(message="Not your child's record.", status=403)
        qs = TransportAssignment.objects.filter(student=student).select_related("route")
        return success(data=TransportAssignmentSerializer(qs, many=True).data)


# ================================================================ Meals / Mess
class MealMenusView(MessPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = MealMenuSerializer
    queryset = MealMenu.objects.all()

    def perform_create(self, serializer):
        menu = serializer.save()
        log(actor=self.request.user, action="student_services.meal_menu_created", target=menu, request=self.request)


class MealMenuDetailView(MessPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = MealMenuSerializer
    queryset = MealMenu.objects.all()
    lookup_url_kwarg = "menu_id"

    def perform_update(self, serializer):
        menu = serializer.save()
        log(actor=self.request.user, action="student_services.meal_menu_updated", target=menu, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="student_services.meal_menu_deleted", target=instance, request=self.request)
        instance.delete()


# ================================================================ Activities
class ActivitiesView(ActivitiesPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = ActivitySerializer
    queryset = Activity.objects.select_related("supervisor")

    def perform_create(self, serializer):
        activity = serializer.save()
        log(actor=self.request.user, action="student_services.activity_created", target=activity, request=self.request)


class ActivityDetailView(ActivitiesPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = ActivitySerializer
    queryset = Activity.objects.all()
    lookup_url_kwarg = "activity_id"

    def perform_update(self, serializer):
        activity = serializer.save()
        log(actor=self.request.user, action="student_services.activity_updated", target=activity, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="student_services.activity_deleted", target=instance, request=self.request)
        instance.delete()


class ActivityParticipantsView(ActivitiesPermissionMixin, ListCreateAPIView):
    write_action = "enroll"
    serializer_class = ActivityParticipantSerializer

    def get_queryset(self):
        return ActivityParticipant.objects.filter(activity_id=self.kwargs["activity_id"]).select_related("student__user")

    def perform_create(self, serializer):
        participant = serializer.save(activity_id=self.kwargs["activity_id"])
        log(actor=self.request.user, action="student_services.activity_enrolled", target=participant, request=self.request)


class ActivityParticipantDetailView(ActivitiesPermissionMixin, RetrieveUpdateDestroyAPIView):
    write_action = "enroll"
    serializer_class = ActivityParticipantSerializer
    queryset = ActivityParticipant.objects.all()
    lookup_url_kwarg = "participant_id"

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="student_services.activity_unenrolled", target=instance, request=self.request)
        instance.delete()


# ================================================================ Student Resources
class StudentResourcesView(ResourcesPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = StudentResourceSerializer

    def get_queryset(self):
        qs = StudentResource.objects.select_related("class_arm", "uploaded_by")
        class_arm = self.request.query_params.get("class_arm")
        if class_arm:
            qs = qs.filter(class_arm_id=class_arm)
        return qs

    def perform_create(self, serializer):
        resource = serializer.save(uploaded_by=self.request.user)
        log(actor=self.request.user, action="student_services.resource_created", target=resource, request=self.request)


class StudentResourceDetailView(ResourcesPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = StudentResourceSerializer
    queryset = StudentResource.objects.all()
    lookup_url_kwarg = "resource_id"

    def perform_update(self, serializer):
        resource = serializer.save()
        log(actor=self.request.user, action="student_services.resource_updated", target=resource, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="student_services.resource_deleted", target=instance, request=self.request)
        instance.delete()


class MyResourcesView(APIView):
    """Student Portal > E-Learning/Resources: materials uploaded for the
    logged-in student's own class-arm — same scoping StudentResourcesView
    already applies for staff, just derived from the caller instead of a
    ?class_arm= query param."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = getattr(request.user, "student_profile", None)
        if student is None:
            return failure(message="No student profile on this account.", status=403)
        if student.class_arm_id is None:
            return success(data=[])
        qs = StudentResource.objects.filter(class_arm_id=student.class_arm_id).select_related("class_arm", "uploaded_by")
        return success(data=StudentResourceSerializer(qs, many=True).data)


class ChildResourcesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        student = _child_or_403(request, student_id)
        if student is None:
            return failure(message="Not your child's record.", status=403)
        if student.class_arm_id is None:
            return success(data=[])
        qs = StudentResource.objects.filter(class_arm_id=student.class_arm_id).select_related("class_arm", "uploaded_by")
        return success(data=StudentResourceSerializer(qs, many=True).data)


def _teaching_class_arm_ids(user, session):
    """Same helper as apps.academics.views — duplicated locally rather than
    imported cross-app, matching this codebase's existing convention of
    small per-app ownership helpers (see _child_or_403 above) over a shared
    utility module."""
    if not session:
        return set()
    taught = set(ClassSubjectAssignment.objects.filter(teacher=user, session=session).values_list("class_arm_id", flat=True))
    class_teacher_of = set(ClassTeacherAssignment.objects.filter(teacher=user, session=session).values_list("class_arm_id", flat=True))
    return taught | class_teacher_of


class MyTeachingResourcesView(APIView):
    """Teacher Portal > Lesson Notes / Resources & E-Learning: materials for
    any class-arm I teach, whoever uploaded them, plus uploading new ones —
    both nav items share this endpoint, distinguished only by the
    `category` filter/value the frontend passes ("Lesson Note" vs anything
    else), so they don't need two near-identical models."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        session = _current_session()
        arm_ids = _teaching_class_arm_ids(request.user, session)
        qs = StudentResource.objects.filter(class_arm_id__in=arm_ids).select_related("class_arm", "uploaded_by")
        category = request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)
        return success(data=StudentResourceSerializer(qs, many=True).data)

    def post(self, request):
        session = _current_session()
        class_arm = request.data.get("class_arm")
        if class_arm not in {str(i) for i in _teaching_class_arm_ids(request.user, session)}:
            return failure(message="Not one of your classes.", status=403)
        serializer = StudentResourceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resource = serializer.save(uploaded_by=request.user)
        log(actor=request.user, action="student_services.resource_created", target=resource, request=request)
        return success(message="Uploaded.", data=StudentResourceSerializer(resource).data, status=201)


class MyTeachingResourceUploadView(APIView):
    """Raw file upload backing the Lesson Notes / Resources uploader — same
    storage plumbing as settings_app.AssetUploadView (S3 when configured,
    local disk only in DEBUG) but open to any authenticated staff member
    and any file type, not just images, since lesson notes/past questions
    are commonly PDFs and documents."""

    permission_classes = [IsAuthenticated]
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
        saved_path = default_storage.save(f"resources/{uuid.uuid4().hex}{ext}", file)
        url = default_storage.url(saved_path)
        log(actor=request.user, action="student_services.resource_file_uploaded", changes={"path": saved_path}, request=request)
        return success(data={"url": url, "file_name": file.name})


class MyTeachingResourceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, resource_id):
        resource = get_object_or_404(StudentResource, id=resource_id)
        if resource.uploaded_by_id != request.user.id:
            return failure(message="You can only remove your own uploads.", status=403)
        log(actor=request.user, action="student_services.resource_deleted", target=resource, request=request)
        resource.delete()
        return success(message="Removed.")


# ================================================================ Health
class HealthRecordView(HealthPermissionMixin, APIView):
    """Get-or-create a health record for one student — every student has at
    most one, so this is keyed by student rather than being a flat CRUD list."""

    def get(self, request, student_id):
        student = get_object_or_404(Student, id=student_id)
        record, _created = HealthRecord.objects.get_or_create(student=student)
        return success(data=HealthRecordSerializer(record).data)

    def put(self, request, student_id):
        student = get_object_or_404(Student, id=student_id)
        record, _created = HealthRecord.objects.get_or_create(student=student)
        serializer = HealthRecordSerializer(record, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log(actor=request.user, action="student_services.health_record_updated", target=record, request=request)
        return success(message="Health record updated.", data=serializer.data)


class HealthIncidentsView(HealthPermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = HealthIncidentSerializer

    def get_queryset(self):
        return HealthIncident.objects.filter(student_id=self.kwargs["student_id"]).select_related("recorded_by")

    def perform_create(self, serializer):
        incident = serializer.save(student_id=self.kwargs["student_id"], recorded_by=self.request.user)
        log(actor=self.request.user, action="student_services.health_incident_recorded", target=incident, request=self.request)


class HealthIncidentDetailView(HealthPermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = HealthIncidentSerializer
    queryset = HealthIncident.objects.all()
    lookup_url_kwarg = "incident_id"

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="student_services.health_incident_deleted", target=instance, request=self.request)
        instance.delete()


# ================================================================ Discipline
class DisciplineRecordsView(DisciplinePermissionMixin, ListCreateAPIView):
    write_action = "create"
    serializer_class = DisciplineRecordSerializer

    def get_queryset(self):
        qs = DisciplineRecord.objects.select_related("student__user", "student__class_arm", "recorded_by")
        student = self.request.query_params.get("student")
        severity = self.request.query_params.get("severity")
        if student:
            qs = qs.filter(student_id=student)
        if severity:
            qs = qs.filter(severity=severity)
        return qs

    def perform_create(self, serializer):
        record = serializer.save(recorded_by=self.request.user)
        log(actor=self.request.user, action="student_services.discipline_recorded", target=record, request=self.request)


class DisciplineRecordDetailView(DisciplinePermissionMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = DisciplineRecordSerializer
    queryset = DisciplineRecord.objects.all()
    lookup_url_kwarg = "record_id"

    def perform_update(self, serializer):
        record = serializer.save()
        log(actor=self.request.user, action="student_services.discipline_updated", target=record, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="student_services.discipline_deleted", target=instance, request=self.request)
        instance.delete()
