from rest_framework import serializers

from .models import Permission, Role, RolePermission, UserRole


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ["id", "code", "module", "action", "description"]
        read_only_fields = fields


class RoleSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ["id", "name", "slug", "description", "is_system", "permissions", "created_at"]
        read_only_fields = ["id", "is_system", "permissions", "created_at"]

    def get_permissions(self, obj):
        return list(obj.role_permissions.values_list("permission__code", flat=True))

    def validate(self, attrs):
        # name/slug are only unique among is_deleted=False roles (see the
        # model's partial UniqueConstraints) — dropping unique=True there
        # also dropped DRF's auto-validator, so redo the check here.
        errors = {}
        exclude_id = self.instance.id if self.instance else None
        for field in ("name", "slug"):
            value = attrs.get(field)
            if not value:
                continue
            qs = Role.objects.filter(is_deleted=False, **{field: value})
            if exclude_id:
                qs = qs.exclude(id=exclude_id)
            if qs.exists():
                errors[field] = [f"role with this {field} already exists."]
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class RolePermissionsUpdateSerializer(serializers.Serializer):
    permission_codes = serializers.ListField(child=serializers.CharField(), allow_empty=True)

    def validate_permission_codes(self, codes):
        found = set(Permission.objects.filter(code__in=codes).values_list("code", flat=True))
        missing = set(codes) - found
        if missing:
            raise serializers.ValidationError(f"Unknown permission code(s): {', '.join(sorted(missing))}")
        return codes


class UserRoleAssignSerializer(serializers.Serializer):
    role_ids = serializers.ListField(child=serializers.UUIDField(), allow_empty=True)

    def validate_role_ids(self, role_ids):
        found = set(Role.objects.filter(id__in=role_ids).values_list("id", flat=True))
        missing = set(role_ids) - found
        if missing:
            raise serializers.ValidationError(f"Unknown role id(s): {', '.join(str(m) for m in missing)}")
        return role_ids
