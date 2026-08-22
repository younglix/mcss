from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import OTPChallenge, User, UserSession


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ["-created_at"]
    list_display = ["email", "identifier", "phone", "user_type", "is_active", "is_superadmin"]
    list_filter = ["user_type", "is_active", "is_superadmin"]
    search_fields = ["email", "identifier", "phone", "full_name"]
    fieldsets = (
        (None, {"fields": ("email", "phone", "identifier", "password")}),
        ("Profile", {"fields": ("full_name", "user_type", "avatar")}),
        ("Access", {"fields": ("is_active", "is_staff", "is_superadmin", "two_factor_enabled", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login_at",)}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "full_name", "user_type", "password1", "password2")}),
    )


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ["user", "ip_address", "created_at", "last_used_at", "revoked_at"]
    list_filter = ["revoked_at"]
    search_fields = ["user__email", "ip_address"]


@admin.register(OTPChallenge)
class OTPChallengeAdmin(admin.ModelAdmin):
    list_display = ["user", "purpose", "expires_at", "consumed_at", "attempts"]
    list_filter = ["purpose"]
