from django.urls import path

from . import views

urlpatterns = [
    path("", views.NotificationsListView.as_view(), name="notifications-list"),
    path("unread-count", views.UnreadCountView.as_view(), name="notifications-unread-count"),
    path("<uuid:notification_id>/read", views.MarkReadView.as_view(), name="notifications-mark-read"),
    path("read-all", views.MarkAllReadView.as_view(), name="notifications-mark-all-read"),
    path("broadcast", views.BroadcastView.as_view(), name="notifications-broadcast"),
]
