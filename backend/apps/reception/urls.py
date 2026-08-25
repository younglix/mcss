from django.urls import path

from . import views

urlpatterns = [
    path("visitors", views.VisitorLogListView.as_view(), name="reception-visitors"),
    path("visitors/<uuid:pk>", views.VisitorLogDetailView.as_view(), name="reception-visitor-detail"),
    path("visitors/<uuid:visitor_id>/check-out", views.VisitorCheckOutView.as_view(), name="reception-visitor-checkout"),
]
