from datetime import date

from django.apps import apps as django_apps
from django.contrib.auth import get_user_model

from apps.audit.models import AuditLog
from apps.configuration.models import SchoolClass

User = get_user_model()


def _has(app_label):
    """
    Lets each widget degrade to 0/empty until its module lands, instead of
    the dashboard erroring out — so the Super Admin shell can ship before
    students/finance/exams exist.
    """
    return django_apps.is_installed(f"apps.{app_label}")


def build_summary():
    return {
        "students": 0 if not _has("students") else django_apps.get_model("students", "Student").objects.filter(is_deleted=False).count(),
        "teachers": 0 if not _has("academics") else django_apps.get_model("academics", "Teacher").objects.count(),
        "staff": 0 if not _has("hr") else django_apps.get_model("hr", "Employee").objects.count(),
        "parents": User.objects.filter(user_type=User.UserType.PARENT).count(),
        "classes": SchoolClass.objects.count(),
    }


def build_financial():
    if not _has("finance"):
        return {"fees_collected": 0, "outstanding_fees": 0, "todays_payments": 0}
    payment_model = django_apps.get_model("finance", "Payment")  # wired when apps.finance lands
    return {
        "fees_collected": 0,
        "outstanding_fees": 0,
        "todays_payments": payment_model.objects.filter(created_at__date=date.today()).count(),
    }


def build_academic():
    if not _has("attendance"):
        present_today, absent_today = 0, 0
    else:
        present_today, absent_today = 0, 0  # wired when apps.attendance lands

    return {
        "present_today": present_today,
        "absent_today": absent_today,
        "upcoming_exams": 0,   # wired when apps.exams lands
        "pending_results": 0,  # wired when apps.exams lands
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
