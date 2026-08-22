from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView

from apps.audit.services import log
from common.responses import failure, success

from .models import Permission, PermissionsVersion, Role, RolePermission, UserRole
from .permissions import HasPermission
from .serializers import (
    PermissionSerializer,
    RolePermissionsUpdateSerializer,
    RoleSerializer,
    UserRoleAssignSerializer,
)

User = get_user_model()


class PermissionsListView(APIView):
    permission_classes = [HasPermission("roles.view")]

    def get(self, request):
        return success(data=PermissionSerializer(Permission.objects.all(), many=True).data)


class RolesView(APIView):
    def get_permissions(self):
        return [HasPermission("roles.view")] if self.request.method == "GET" else [HasPermission("roles.create")]

    def get(self, request):
        return success(data=RoleSerializer(Role.objects.all(), many=True).data)

    def post(self, request):
        serializer = RoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = Role.objects.create(
            name=serializer.validated_data["name"],
            slug=serializer.validated_data["slug"],
            description=serializer.validated_data.get("description", ""),
        )
        log(actor=request.user, action="role.created", target=role, request=request)
        return success(message="Role created.", data=RoleSerializer(role).data, status=201)


class RoleDetailView(APIView):
    def get_permissions(self):
        mapping = {"GET": "roles.view", "PATCH": "roles.edit", "DELETE": "roles.delete"}
        return [HasPermission(mapping[self.request.method])]

    def get(self, request, role_id):
        role = get_object_or_404(Role, id=role_id)
        return success(data=RoleSerializer(role).data)

    def patch(self, request, role_id):
        role = get_object_or_404(Role, id=role_id)
        serializer = RoleSerializer(role, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        before = {"name": role.name, "description": role.description}
        for field in ("name", "description"):
            if field in serializer.validated_data:
                setattr(role, field, serializer.validated_data[field])
        role.save()
        log(actor=request.user, action="role.updated", target=role,
            changes={"before": before, "after": {"name": role.name, "description": role.description}},
            request=request)
        return success(message="Role updated.", data=RoleSerializer(role).data)

    def delete(self, request, role_id):
        role = get_object_or_404(Role, id=role_id)
        if role.is_system:
            return failure(message="System roles can't be deleted.", status=400)
        role.soft_delete()
        log(actor=request.user, action="role.deleted", target=role, request=request)
        return success(message="Role deleted.")


class RolePermissionsView(APIView):
    permission_classes = [HasPermission("roles.edit")]

    def put(self, request, role_id):
        role = get_object_or_404(Role, id=role_id)
        serializer = RolePermissionsUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        codes = serializer.validated_data["permission_codes"]

        before = list(role.role_permissions.values_list("permission__code", flat=True))
        role.role_permissions.all().delete()
        permissions = Permission.objects.filter(code__in=codes)
        RolePermission.objects.bulk_create([RolePermission(role=role, permission=p) for p in permissions])

        new_version = PermissionsVersion.bump()
        log(actor=request.user, action="role.permissions_changed", target=role,
            changes={"before": before, "after": codes}, request=request)

        return success(message="Role permissions updated.", data={
            "role": RoleSerializer(role).data,
            "perms_version": new_version,
        })


class UserRolesAssignView(APIView):
    permission_classes = [HasPermission("roles.assign")]

    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        serializer = UserRoleAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role_ids = serializer.validated_data["role_ids"]

        before = list(user.user_roles.values_list("role_id", flat=True))
        UserRole.objects.filter(user=user).exclude(role_id__in=role_ids).delete()
        existing = set(user.user_roles.values_list("role_id", flat=True))
        UserRole.objects.bulk_create([
            UserRole(user=user, role_id=rid) for rid in role_ids if rid not in existing
        ])

        new_version = PermissionsVersion.bump()
        log(actor=request.user, action="user.roles_assigned", target=user,
            changes={"before": [str(r) for r in before], "after": [str(r) for r in role_ids]},
            request=request)

        return success(message="Roles assigned.", data={
            "role_ids": list(user.user_roles.values_list("role_id", flat=True)),
            "perms_version": new_version,
        })
