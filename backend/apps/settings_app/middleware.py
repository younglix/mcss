from django.http import JsonResponse
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

from .models import SystemSetting

# Always reachable regardless of maintenance mode: auth (so a superadmin can
# still log in to turn it back off), the public branding the login page
# needs, the health check infra monitoring depends on, and Django admin as
# a last-resort escape hatch.
EXEMPT_PREFIXES = (
    "/api/v1/auth/",
    "/api/v1/settings/public-branding",
    "/api/v1/health",
    "/admin/",
)


class MaintenanceModeMiddleware:
    """A real gate, not just a stored flag: when system.maintenance_enabled
    is on, every request from a non-superadmin gets a 503 instead of
    reaching its view. Auth in this app is JWT-only (no session, so
    request.user isn't resolved by Django's own AuthenticationMiddleware by
    the time middleware runs) — this reads is_superadmin straight off the
    verified access token's claims instead, avoiding a DB hit."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "OPTIONS" or any(request.path.startswith(p) for p in EXEMPT_PREFIXES):
            return self.get_response(request)

        setting = SystemSetting.objects.filter(key="system.maintenance_enabled").first()
        if not setting or not setting.value:
            return self.get_response(request)

        if self._is_superadmin(request):
            return self.get_response(request)

        message = SystemSetting.objects.filter(key="system.maintenance_message").first()
        # A plain JsonResponse, not common.responses.envelope (a DRF Response)
        # — DRF Responses need the view-dispatch machinery to render them,
        # which never runs here since this short-circuits before any view.
        return JsonResponse(
            {
                "success": False,
                "message": (message.value if message else "") or "The system is currently under maintenance. Please check back soon.",
                "data": None,
                "errors": {"code": "maintenance_mode"},
                "meta": None,
            },
            status=503,
        )

    def _is_superadmin(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return False
        try:
            token = AccessToken(auth_header.split(" ", 1)[1])
        except TokenError:
            return False
        return bool(token.get("is_superadmin"))
