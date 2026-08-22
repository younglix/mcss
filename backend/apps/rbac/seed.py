from django.db import transaction

from .constants import DEFAULT_ROLES, flatten_permissions
from .models import Permission, Role, RolePermission


@transaction.atomic
def seed_permissions():
    created = 0
    for code, module, action in flatten_permissions():
        _, was_created = Permission.objects.get_or_create(
            code=code, defaults={"module": module, "action": action}
        )
        created += int(was_created)
    return created


@transaction.atomic
def seed_default_roles():
    created_roles = 0
    for slug, spec in DEFAULT_ROLES.items():
        role, was_created = Role.objects.get_or_create(
            slug=slug, defaults={"name": spec["name"], "description": spec["description"], "is_system": True}
        )
        created_roles += int(was_created)

        permissions = Permission.objects.filter(code__in=spec["permissions"])
        existing = set(role.role_permissions.values_list("permission_id", flat=True))
        RolePermission.objects.bulk_create(
            [RolePermission(role=role, permission=p) for p in permissions if p.id not in existing]
        )
    return created_roles


def run():
    perms_created = seed_permissions()
    roles_created = seed_default_roles()
    return perms_created, roles_created
