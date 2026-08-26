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
    # Students/Teachers/Attendance/Exams live inside apps.academics (one app,
    # not the separate apps.students/apps.hr the spec originally sketched —
    # Teachers in particular reuses accounts.User rather than a dedicated
    # model, since Staff Management already owns that account data).
    academics_available = _has("academics")
    student_count = 0
    teacher_count = 0
    if academics_available:
        student_count = django_apps.get_model("academics", "Student").objects.filter(user__is_deleted=False).count()
        teacher_count = User.objects.filter(user_type=User.UserType.STAFF, is_deleted=False, is_active=True).count()
    return {
        "students": _metric(student_count, available=academics_available),
        "teachers": _metric(teacher_count, available=academics_available),
        "staff": _metric(
            django_apps.get_model("hr", "Employee").objects.count() if _has("hr") else 0,
            available=_has("hr"),
        ),
        "parents": _metric(User.objects.filter(user_type=User.UserType.PARENT).count()),
        "classes": _metric(SchoolClass.objects.count()),
    }


def build_financial():
    finance_available = _has("finance")
    if not finance_available:
        return {
            "fees_collected": _metric(0, available=False),
            "outstanding_fees": _metric(0, available=False),
            "todays_payments": _metric(0, available=False),
        }
    from django.db.models import Sum

    Payment = django_apps.get_model("finance", "Payment")
    Invoice = django_apps.get_model("finance", "Invoice")
    completed = Payment.objects.filter(status="completed")
    total_invoiced = Invoice.objects.aggregate(total=Sum("amount"))["total"] or 0
    total_collected = completed.aggregate(total=Sum("amount"))["total"] or 0
    return {
        "fees_collected": _metric(total_collected),
        "outstanding_fees": _metric(total_invoiced - total_collected),
        "todays_payments": _metric(completed.filter(paid_at__date=date.today()).count()),
    }


def build_academic():
    # Attendance/Exams also live in apps.academics — see build_summary().
    academics_available = _has("academics")
    present_today = absent_today = upcoming_exams = pending_results = 0
    if academics_available:
        AttendanceRecord = django_apps.get_model("academics", "AttendanceRecord")
        Exam = django_apps.get_model("academics", "Exam")
        today = date.today()
        present_today = AttendanceRecord.objects.filter(date=today, status="present").count()
        absent_today = AttendanceRecord.objects.filter(date=today, status="absent").count()
        upcoming_exams = Exam.objects.filter(start_date__gte=today).count()
        pending_results = Exam.objects.filter(status="completed").count()
    return {
        "present_today": _metric(present_today, available=academics_available),
        "absent_today": _metric(absent_today, available=academics_available),
        "upcoming_exams": _metric(upcoming_exams, available=academics_available),
        "pending_results": _metric(pending_results, available=academics_available),
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
