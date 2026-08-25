from django.urls import path

from . import views

urlpatterns = [
    path("announcements", views.SiteAnnouncementListView.as_view(), name="cms-announcements"),
    path("announcements/<uuid:pk>", views.SiteAnnouncementDetailView.as_view(), name="cms-announcement-detail"),
    path("announcements/active", views.PublicActiveAnnouncementsView.as_view(), name="cms-announcements-active"),
]
