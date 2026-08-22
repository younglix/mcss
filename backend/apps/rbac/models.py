from django.db import models

from common.models import BaseModel


class Permission(BaseModel):
    code = models.CharField(max_length=100, unique=True)   # "results.approve"
    module = models.CharField(max_length=50)                # "results"
    action = models.CharField(max_length=50)                # "approve"
    description = models.CharField(max_length=255, blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["module", "action"]

    def __str__(self):
        return self.code


class Role(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.CharField(max_length=255, blank=True)
    is_system = models.BooleanField(default=False)

    class Meta(BaseModel.Meta):
        ordering = ["name"]

    def __str__(self):
        return self.name


class RolePermission(BaseModel):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_permissions")
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name="role_permissions")

    class Meta(BaseModel.Meta):
        unique_together = ("role", "permission")


class UserRole(BaseModel):
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="user_roles")
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="user_roles")

    class Meta(BaseModel.Meta):
        unique_together = ("user", "role")


class PermissionsVersion(models.Model):
    """
    Singleton row holding the global perms_version counter embedded in every
    JWT. Bumping it (on any role/permission/assignment change) tells clients
    holding a stale token to re-fetch /auth/me rather than trust cached
    claims. Kept in the database, not just cache, so it survives cache
    backend restarts/evictions and is correct across multiple app servers.
    """

    version = models.PositiveIntegerField(default=1)

    @classmethod
    def current(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj.version

    @classmethod
    def bump(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        obj.version = models.F("version") + 1
        obj.save(update_fields=["version"])
        obj.refresh_from_db()
        return obj.version
