from django.urls import path

from . import views

urlpatterns = [
    path("events", views.EventListView.as_view(), name="calendar-events"),
    path("events/<uuid:pk>", views.EventDetailView.as_view(), name="calendar-event-detail"),
]
