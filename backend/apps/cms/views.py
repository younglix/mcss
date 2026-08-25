from django.db.models import Q
from django.utils import timezone
from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import AllowAny

from apps.audit.services import log
from apps.rbac.permissions import HasPermission

from .models import SiteAnnouncement
from .serializers import SiteAnnouncementSerializer


class SiteAnnouncementListView(ListCreateAPIView):
    serializer_class = SiteAnnouncementSerializer
    queryset = SiteAnnouncement.objects.all()
    search_fields = ["title"]

    def get_permissions(self):
        code = "cms.view" if self.request.method == "GET" else "cms.edit"
        return [HasPermission(code)]

    def perform_create(self, serializer):
        announcement = serializer.save()
        log(actor=self.request.user, action="cms.announcement_created", target=announcement, request=self.request)


class SiteAnnouncementDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = SiteAnnouncementSerializer
    queryset = SiteAnnouncement.objects.all()

    def get_permissions(self):
        code = "cms.view" if self.request.method == "GET" else "cms.edit"
        return [HasPermission(code)]

    def perform_update(self, serializer):
        announcement = serializer.save()
        log(actor=self.request.user, action="cms.announcement_updated", target=announcement, request=self.request)

    def perform_destroy(self, instance):
        log(actor=self.request.user, action="cms.announcement_deleted", target=instance, request=self.request)
        instance.delete()


class PublicActiveAnnouncementsView(ListAPIView):
    """Unauthenticated — the public site reads currently-active announcements from here."""
    serializer_class = SiteAnnouncementSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        now = timezone.now()
        return SiteAnnouncement.objects.filter(is_active=True).filter(
            Q(starts_at__isnull=True) | Q(starts_at__lte=now),
            Q(ends_at__isnull=True) | Q(ends_at__gte=now),
        )
