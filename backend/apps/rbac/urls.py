from django.urls import path

from . import views

urlpatterns = [
    path("permissions", views.PermissionsListView.as_view(), name="rbac-permissions"),
    path("roles", views.RolesView.as_view(), name="rbac-roles"),
    path("roles/<uuid:role_id>", views.RoleDetailView.as_view(), name="rbac-role-detail"),
    path("roles/<uuid:role_id>/permissions", views.RolePermissionsView.as_view(), name="rbac-role-permissions"),
    path("users/<uuid:user_id>/roles", views.UserRolesAssignView.as_view(), name="rbac-user-roles"),
]
