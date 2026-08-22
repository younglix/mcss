from rest_framework.views import APIView

from apps.rbac.permissions import HasPermission
from common.responses import success

from . import services


class DashboardSummaryView(APIView):
    permission_classes = [HasPermission("dashboard.view")]

    def get(self, request):
        return success(data=services.build_summary())


class DashboardFinancialView(APIView):
    permission_classes = [HasPermission("dashboard.view")]

    def get(self, request):
        return success(data=services.build_financial())


class DashboardAcademicView(APIView):
    permission_classes = [HasPermission("dashboard.view")]

    def get(self, request):
        return success(data=services.build_academic())


class DashboardRecentActivityView(APIView):
    permission_classes = [HasPermission("dashboard.view")]

    def get(self, request):
        limit = int(request.query_params.get("limit", 20))
        return success(data=services.build_recent_activity(limit=limit))
