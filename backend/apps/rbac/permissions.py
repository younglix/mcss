from django.core.cache import cache
from rest_framework.permissions import BasePermission

from .models import PermissionsVersion, RolePermission

CACHE_TTL = 300


def get_perms_version(user):
    return PermissionsVersion.current()


def get_effective_permissions(user) -> set:
    if not user or not user.is_authenticated:
        return set()
    if user.is_superadmin:
        return {"*"}

    version = get_perms_version(user)
    cache_key = f"rbac:perms:{user.id}:{version}"
    cached = cache.get(cache_key)
    if cached is not None:
        return set(cached)

    perms = set(
        RolePermission.objects.filter(role__user_roles__user=user)
        .values_list("permission__code", flat=True)
        .distinct()
    )
    cache.set(cache_key, list(perms), CACHE_TTL)
    return perms


def has_permission_code(user, code) -> bool:
    perms = get_effective_permissions(user)
    return "*" in perms or code in perms


class HasPermission(BasePermission):
    """Usage: permission_classes = [HasPermission("students.view")]"""

    def __init__(self, code):
        self.code = code

    def __call__(self):
        # DRF instantiates permission_classes with no args; returning self
        # from __call__ lets HasPermission("x") be dropped straight into a
        # permission_classes list like a class would be.
        return self

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated) and has_permission_code(request.user, self.code)
