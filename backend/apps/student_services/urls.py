from django.urls import path

from . import views

urlpatterns = [
    # Library
    path("library/books", views.BooksView.as_view(), name="ss-books"),
    path("library/books/<uuid:book_id>", views.BookDetailView.as_view(), name="ss-book-detail"),
    path("library/loans", views.BookLoansView.as_view(), name="ss-book-loans"),
    path("library/loans/<uuid:loan_id>/return", views.BookLoanReturnView.as_view(), name="ss-book-loan-return"),

    # Hostel
    path("hostel/blocks", views.HostelBlocksView.as_view(), name="ss-hostel-blocks"),
    path("hostel/blocks/<uuid:block_id>", views.HostelBlockDetailView.as_view(), name="ss-hostel-block-detail"),
    path("hostel/blocks/<uuid:block_id>/rooms", views.HostelRoomsView.as_view(), name="ss-hostel-rooms"),
    path("hostel/rooms/<uuid:room_id>", views.HostelRoomDetailView.as_view(), name="ss-hostel-room-detail"),
    path("hostel/allocations", views.HostelAllocationsView.as_view(), name="ss-hostel-allocations"),
    path("hostel/allocations/<uuid:allocation_id>/vacate", views.HostelVacateView.as_view(), name="ss-hostel-vacate"),

    # Transport
    path("transport/routes", views.TransportRoutesView.as_view(), name="ss-transport-routes"),
    path("transport/routes/<uuid:route_id>", views.TransportRouteDetailView.as_view(), name="ss-transport-route-detail"),
    path("transport/vehicles", views.VehiclesView.as_view(), name="ss-vehicles"),
    path("transport/vehicles/<uuid:vehicle_id>", views.VehicleDetailView.as_view(), name="ss-vehicle-detail"),
    path("transport/assignments", views.TransportAssignmentsView.as_view(), name="ss-transport-assignments"),
    path("transport/assignments/<uuid:assignment_id>", views.TransportAssignmentDetailView.as_view(), name="ss-transport-assignment-detail"),

    # Meals / Mess
    path("mess/menus", views.MealMenusView.as_view(), name="ss-meal-menus"),
    path("mess/menus/<uuid:menu_id>", views.MealMenuDetailView.as_view(), name="ss-meal-menu-detail"),

    # Activities
    path("activities", views.ActivitiesView.as_view(), name="ss-activities"),
    path("activities/<uuid:activity_id>", views.ActivityDetailView.as_view(), name="ss-activity-detail"),
    path("activities/<uuid:activity_id>/participants", views.ActivityParticipantsView.as_view(), name="ss-activity-participants"),
    path("activities/participants/<uuid:participant_id>", views.ActivityParticipantDetailView.as_view(), name="ss-activity-participant-detail"),

    # Student Resources
    path("resources", views.StudentResourcesView.as_view(), name="ss-resources"),
    path("resources/<uuid:resource_id>", views.StudentResourceDetailView.as_view(), name="ss-resource-detail"),

    # Health
    path("health/students/<uuid:student_id>/record", views.HealthRecordView.as_view(), name="ss-health-record"),
    path("health/students/<uuid:student_id>/incidents", views.HealthIncidentsView.as_view(), name="ss-health-incidents"),
    path("health/incidents/<uuid:incident_id>", views.HealthIncidentDetailView.as_view(), name="ss-health-incident-detail"),
]
