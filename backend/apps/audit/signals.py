from django.conf import settings
from django.db.models.signals import pre_save
from django.dispatch import receiver

from .middleware import get_current_request
from .services import log

SENSITIVE_FIELDS = ("is_active", "is_superadmin")


@receiver(pre_save, sender=settings.AUTH_USER_MODEL)
def audit_sensitive_user_changes(sender, instance, **kwargs):
    if instance._state.adding:
        return
    try:
        previous = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return

    changed = {
        field: {"before": getattr(previous, field), "after": getattr(instance, field)}
        for field in SENSITIVE_FIELDS
        if getattr(previous, field) != getattr(instance, field)
    }
    if not changed:
        return

    request = get_current_request()
    actor = getattr(request, "user", None) if request else None
    log(
        actor=actor if actor and actor.is_authenticated else None,
        action="user.sensitive_field_changed",
        target=instance,
        changes=changed,
        request=request,
    )
