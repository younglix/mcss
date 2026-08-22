from contextvars import ContextVar

_current_request: ContextVar = ContextVar("current_request", default=None)


def get_current_request():
    """
    Lets code outside the view layer (signal handlers, model.save() hooks)
    resolve the in-flight request for audit purposes, without every call
    site having to thread `request` through manually.
    """
    return _current_request.get()


class RequestContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        token = _current_request.set(request)
        try:
            return self.get_response(request)
        finally:
            _current_request.reset(token)
