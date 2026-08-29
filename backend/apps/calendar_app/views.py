from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated

from apps.audit.services import log
from apps.rbac.permissions import HasPermission

from .models import Event
from .serializers import EventSerializer


class EventListView(ListCreateAPIView):
    serializer_class = EventSerializer
    search_fields = ["title", "location"]

    def get_permissions(self):
        code = "calendar.view" if self.request.method == "GET" else "calendar.create"
        return [HasPermission(code)]

    def get_queryset(self):
        qs = Event.objects.all()
        date_from = self.request.query_params.get("from")
        date_to = self.request.query_params.get("to")
        if date_from:
            qs = qs.filter(start_at__gte=date_from)
        if date_to:
            qs = qs.filter(start_at__lte=date_to)
        return qs

    def perform_create(self, serializer):
        event = serializer.save()
        log(actor=self.request.user, action="calendar.event_created", target=event, request=self.request)


class EventDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = EventSerializer
    queryset = Event.objects.all()

    def get_permissions(self):
        mapping = {"GET": "calendar.view", "PATCH": "calendar.edit", "PUT": "calendar.edit", "DELETE": "calendar.delete"}
        return [HasPermission(mapping[self.request.method])]

    def perform_update(self, serializer):
        event = serializer.save()
        log(actor=self.request.user, action="calendar.event_updated", target=event, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="calendar.event_deleted", target=instance, request=self.request)
        instance.delete()


class MyEventsView(ListAPIView):
    """Student/Parent Portal > Events & Calendar: read-only, scoped to
    events whose audience includes this caller's role — no calendar.*
    permission needed, since every authenticated caller may see events
    addressed to their own role. Which audience values apply is decided by
    ?audience=students|parents, passed by the frontend per portal."""

    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        role = self.request.query_params.get("audience")
        allowed = (
            {Event.Audience.ALL, role}
            if role in (Event.Audience.STUDENTS, Event.Audience.PARENTS, Event.Audience.STAFF)
            else {Event.Audience.ALL}
        )
        qs = Event.objects.filter(audience__in=allowed)
        date_from = self.request.query_params.get("from")
        date_to = self.request.query_params.get("to")
        if date_from:
            qs = qs.filter(start_at__gte=date_from)
        if date_to:
            qs = qs.filter(start_at__lte=date_to)
        return qs
