from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/users/", include("apps.accounts.user_urls")),
    path("api/v1/rbac/", include("apps.rbac.urls")),
    path("api/v1/config/", include("apps.configuration.urls")),
    path("api/v1/settings/", include("apps.settings_app.urls")),
    path("api/v1/audit/", include("apps.audit.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    path("api/v1/dashboard/", include("apps.dashboard.urls")),
    path("api/v1/reception/", include("apps.reception.urls")),
    path("api/v1/calendar/", include("apps.calendar_app.urls")),
    path("api/v1/cms/", include("apps.cms.urls")),
    path("api/v1/academics/", include("apps.academics.urls")),
    path("api/v1/finance/", include("apps.finance.urls")),
    path("api/v1/student-services/", include("apps.student_services.urls")),
    path("api/v1/operations/", include("apps.operations.urls")),
    path("api/v1/admissions/", include("apps.admissions.urls")),
]
