from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from django.utils.crypto import get_random_string

from apps.notifications.channels.email import send_raw
from apps.notifications.services import dispatch, send_credentials_email
from apps.settings_app.models import SystemSetting
from apps.settings_app.numbering import generate_number

User = get_user_model()


def find_or_create_parent(name, email, phone):
    """One guardian, many students, one account: looks up an existing
    parent-type User by email then phone before creating a new one, so a
    second child's acceptance attaches to the same portal login rather than
    minting a duplicate. Returns (user, created, temp_password_or_None) —
    temp_password is only set when a new account was actually created, so
    callers don't re-email credentials to an already-onboarded parent."""
    existing = None
    if email:
        existing = User.objects.filter(is_deleted=False, user_type=User.UserType.PARENT, email__iexact=email).first()
    if not existing and phone:
        existing = User.objects.filter(is_deleted=False, user_type=User.UserType.PARENT, phone=phone).first()
    if existing:
        return existing, False, None

    password = get_random_string(length=12)
    user = User.objects.create_user(
        email=email or None, phone=phone or None, full_name=name or "Parent/Guardian",
        user_type=User.UserType.PARENT, password=password,
    )
    return user, True, password


def _acceptance_fee_amount():
    setting = SystemSetting.objects.filter(key="finance.acceptance_fee_amount").first()
    return setting.value if setting and setting.value else 0


def get_admission_window():
    """Whether the public Apply flow is currently usable — Super Admin now
    creates/controls this (student_admission.is_open + an optional
    opens_at/closes_at duration and target session) instead of the form
    always being live. `is_open` is the master switch: turning it off closes
    applications immediately regardless of dates; turning it on only
    actually opens the form while today falls inside the configured window,
    if one was set (an unset date on either side means no bound on that
    side)."""
    from django.utils.dateparse import parse_date

    from apps.configuration.models import AcademicSession

    keys = [
        "student_admission.is_open", "student_admission.opens_at",
        "student_admission.closes_at", "student_admission.session",
    ]
    settings_by_key = {s.key: s.value for s in SystemSetting.objects.filter(key__in=keys)}
    is_open_flag = bool(settings_by_key.get("student_admission.is_open"))
    opens_at = settings_by_key.get("student_admission.opens_at") or None
    closes_at = settings_by_key.get("student_admission.closes_at") or None
    session_id = settings_by_key.get("student_admission.session") or None

    session_name = None
    if session_id:
        session = AcademicSession.objects.filter(id=session_id).first()
        session_name = session.name if session else None

    today = timezone.localdate()
    parsed_opens = parse_date(opens_at) if opens_at else None
    parsed_closes = parse_date(closes_at) if closes_at else None
    reason = None
    is_open = is_open_flag
    if is_open and parsed_opens and today < parsed_opens:
        is_open = False
        reason = f"Applications open on {opens_at}."
    elif is_open and parsed_closes and today > parsed_closes:
        is_open = False
        reason = f"Applications closed on {closes_at}."
    elif not is_open_flag:
        reason = "Applications are not currently being accepted. Please check back later."

    return {
        "is_open": is_open,
        "reason": reason,
        "opens_at": opens_at,
        "closes_at": closes_at,
        "session_id": session_id,
        "session_name": session_name,
    }


@transaction.atomic
def approve_application(application, reviewer):
    """The full accept -> provision step: creates the student portal (Student
    ID born here), reuses-or-creates the parent portal, sends both their
    credentials, and opens the Acceptance Fee invoice that the rest of the
    workflow (apps.finance.models.Invoice._advance_admission_workflow)
    chains off of. Idempotent: re-calling on an already-provisioned
    application is a safe no-op, returning the existing Student."""
    if application.enrolled_student_id:
        return application.enrolled_student

    from apps.academics.models import Student
    from apps.configuration.models import AcademicSession
    from apps.finance.models import Invoice

    identifier = generate_number("admission")
    student_password = get_random_string(length=12)
    # A student's own email/phone on the application can collide with an
    # existing active user — most commonly a sibling who shares the same
    # household phone as "their" contact. The Student ID (identifier) is
    # always a valid, unique login handle on its own, so drop whichever of
    # email/phone is already taken rather than fail provisioning entirely.
    student_email = application.email or None
    if student_email and User.objects.filter(is_deleted=False, email__iexact=student_email).exists():
        student_email = None
    student_phone = application.phone or None
    if student_phone and User.objects.filter(is_deleted=False, phone=student_phone).exists():
        student_phone = None
    student_user = User.objects.create_user(
        email=student_email, phone=student_phone, identifier=identifier,
        full_name=application.full_name, user_type=User.UserType.STUDENT, password=student_password,
    )

    guardian_user = None
    if application.has_guardian:
        guardian_user, guardian_created, guardian_password = find_or_create_parent(
            application.guardian_name, application.guardian_email, application.guardian_phone,
        )
        if guardian_created:
            send_credentials_email(guardian_user, guardian_password, "Parent")

    student = Student.objects.create(
        user=student_user,
        date_of_birth=application.date_of_birth,
        gender=application.gender,
        guardian_name=application.guardian_name,
        guardian_phone=application.guardian_phone,
        guardian_email=application.guardian_email,
        guardian_user=guardian_user,
        status=Student.Status.PENDING,
    )

    application.status = application.Status.ACCEPTED
    application.reviewed_by = reviewer
    application.reviewed_at = timezone.now()
    application.enrolled_student = student
    application.save(update_fields=["status", "reviewed_by", "reviewed_at", "enrolled_student"])

    # A young student often has no email of their own — deliver their
    # credentials to the guardian's inbox in that case rather than silently
    # dropping them (send_credentials_email still shows the student's own
    # login handle in the message body, not the guardian's address).
    send_credentials_email(
        student_user, student_password, "Student",
        delivery_email=student_user.email or application.guardian_email or None,
    )

    acceptance_body = (
        f"Congratulations {application.full_name}! Your application to Mount Carmel Secondary School "
        f"has been accepted. Log in to your new student portal to pay the acceptance fee and continue enrollment."
    )
    if application.email:
        send_raw(application.email, "Admission Accepted — Mount Carmel Secondary School", acceptance_body)
    if application.guardian_email and application.guardian_email != application.email:
        send_raw(application.guardian_email, "Admission Accepted — Mount Carmel Secondary School", acceptance_body)

    current_session = AcademicSession.objects.filter(is_current=True).first() or AcademicSession.objects.first()
    if current_session:
        invoice = Invoice.objects.create(
            student=student, session=current_session, purpose=Invoice.Purpose.ACCEPTANCE_FEE,
            description="Acceptance Fee", amount=_acceptance_fee_amount(),
        )
        dispatch(
            recipient=guardian_user or student_user,
            title="Acceptance Fee Invoice Ready",
            body=f"An Acceptance Fee invoice of {invoice.amount} has been raised for {application.full_name}. Log in to the portal to pay.",
            category="payment",
        )

    return student


def reject_application(application, reviewer, notes=""):
    application.status = application.Status.REJECTED
    application.reviewed_by = reviewer
    application.reviewed_at = timezone.now()
    application.review_notes = notes
    application.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_notes"])

    body = (
        f"Dear {application.full_name or 'Applicant'},\n\n"
        "Thank you for your interest in Mount Carmel Secondary School. After careful review, "
        "we are unable to offer admission at this time.\n\n"
        + (f"Notes: {notes}\n\n" if notes else "")
        + "We wish you the very best in your search for a school."
    )
    if application.email:
        send_raw(application.email, "Admission Application Update — Mount Carmel Secondary School", body)
    if application.guardian_email and application.guardian_email != application.email:
        send_raw(application.guardian_email, "Admission Application Update — Mount Carmel Secondary School", body)
