from .models import AuditLog


def client_ip(request):
    if request is None:
        return None
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def user_agent(request):
    if request is None:
        return ""
    return request.META.get("HTTP_USER_AGENT", "")


def log(actor, action, target=None, changes=None, request=None):
    AuditLog.objects.create(
        actor=actor,
        action=action,
        target_type=target.__class__.__name__ if target else "",
        target_id=str(getattr(target, "id", "")),
        changes=changes or {},
        ip_address=client_ip(request),
        user_agent=user_agent(request)[:300],
    )
