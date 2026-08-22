from rest_framework.response import Response


def envelope(success=True, message="", data=None, errors=None, meta=None, status=200):
    return Response(
        {
            "success": success,
            "message": message,
            "data": data,
            "errors": errors,
            "meta": meta,
        },
        status=status,
    )


def success(message="", data=None, meta=None, status=200):
    return envelope(success=True, message=message, data=data, meta=meta, status=status)


def failure(message="", errors=None, status=400):
    return envelope(success=False, message=message, errors=errors, status=status)
