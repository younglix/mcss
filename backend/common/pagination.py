from rest_framework.pagination import PageNumberPagination

from common.responses import envelope


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200

    def get_paginated_response(self, data):
        return envelope(
            success=True,
            message="",
            data=data,
            meta={
                "page": self.page.number,
                "page_size": self.get_page_size(self.request),
                "total": self.page.paginator.count,
            },
            status=200,
        )
