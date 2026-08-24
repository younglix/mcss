from datetime import date

from django.apps import apps as django_apps
from django.contrib.auth import get_user_model

from apps.audit.models import AuditLog
from apps.configuration.models import SchoolClass

User = get_user_model()


def _has(app_label):
    """
    Lets each widget degrade until its module lands, instead of the
    dashboard erroring out — so the Super Admin shell can ship before
    students/finance/exams exist.
    """
    return django_apps.is_installed(f"apps.{app_label}")


def _metric(value, available=True):
    """
    Every dashboard number carries whether it's a real, live count or a
    placeholder for a module that doesn't exist yet — the two both render
    as 0 but mean very different things ("no records yet" vs "not built
    yet"), and the frontend needs to tell them apart to show an honest
    empty state instead of a fake zero.
    """
    return {"value": value, "available": available}


def build_summary():
    return {
        "students": _metric(
            django_apps.get_model("students", "Student").objects.filter(is_deleted=False).count() if _has("students") else 0,
            available=_has("students"),
        ),
        "teachers": _metric(
            django_apps.get_model("academics", "Teacher").objects.count() if _has("academics") else 0,
            available=_has("academics"),
        ),
        "staff": _metric(
            django_apps.get_model("hr", "Employee").objects.count() if _has("hr") else 0,
            available=_has("hr"),
        ),
        "parents": _metric(User.objects.filter(user_type=User.UserType.PARENT).count()),
        "classes": _metric(SchoolClass.objects.count()),
    }


def build_financial():
    if not _has("finance"):
        return {
            "fees_collected": _metric(0, available=False),
            "outstanding_fees": _metric(0, available=False),
            "todays_payments": _metric(0, available=False),
        }
    payment_model = django_apps.get_model("finance", "Payment")  # wired when apps.finance lands
    return {
        "fees_collected": _metric(0, available=False),
        "outstanding_fees": _metric(0, available=False),
        "todays_payments": _metric(payment_model.objects.filter(created_at__date=date.today()).count()),
    }


def build_academic():
    attendance_available = _has("attendance")
    exams_available = _has("exams")
    return {
        "present_today": _metric(0, available=attendance_available),
        "absent_today": _metric(0, available=attendance_available),
        "upcoming_exams": _metric(0, available=exams_available),
        "pending_results": _metric(0, available=exams_available),
    }


def build_operations():
    library_available = _has("library")
    hostel_available = _has("hostel")
    transport_available = _has("transport")
    inventory_available = _has("inventory")
    return {
        "inventory_alerts": _metric(0, available=inventory_available),
        "library_activity": _metric(0, available=library_available),
        "hostel_occupancy": _metric(0, available=hostel_available),
        "transport_status": _metric(0, available=transport_available),
    }


def build_recent_activity(limit=20):
    logs = AuditLog.objects.select_related("actor").all()[:limit]
    return [
        {
            "id": str(log.id),
            "actor": log.actor.full_name if log.actor else "System",
            "action": log.action,
            "target_type": log.target_type,
            "created_at": log.created_at,
        }
        for log in logs
    ]
