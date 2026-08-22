import logging

from django.core.exceptions import PermissionDenied
from django.http import Http404
from rest_framework import exceptions as drf_exceptions
from rest_framework.views import exception_handler as drf_exception_handler

from common.responses import failure

logger = logging.getLogger(__name__)


def standard_exception_handler(exc, context):
    """
    Wraps DRF's default handling so every error response — validation,
    auth, permission, not-found, or an uncaught server error — comes back
    in the same envelope shape, and nothing leaks a stack trace.
    """
    if isinstance(exc, Http404):
        exc = drf_exceptions.NotFound()
    elif isinstance(exc, PermissionDenied):
        exc = drf_exceptions.PermissionDenied()

    response = drf_exception_handler(exc, context)

    if response is None:
        logger.exception("Unhandled exception", exc_info=exc)
        return failure(message="An unexpected error occurred.", errors=None, status=500)

    detail = response.data
    if isinstance(detail, dict):
        message = detail.get("detail") or "Request failed"
        errors = {k: v for k, v in detail.items() if k != "detail"} or detail
    elif isinstance(detail, list):
        message = "Request failed"
        errors = detail
    else:
        message = str(detail)
        errors = None

    return failure(message=str(message), errors=errors, status=response.status_code)
