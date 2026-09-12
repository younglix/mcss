from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from django.utils.crypto import get_random_string

from apps.notifications.services import send_credentials_email
from apps.settings_app.numbering import generate_number

from .models import StaffApplication

User = get_user_model()

# Which RBAC role slug a self-registered academic staff type gets assigned.
# Non-academic staff never get a User at all — see approve_staff_application.
_ROLE_SLUG_BY_STAFF_TYPE = {
    StaffApplication.StaffType.PRINCIPAL: "principal",
    StaffApplication.StaffType.TEACHER: "teacher",
    StaffApplication.StaffType.EXAM_OFFICER: "exam_officer",
    StaffApplication.StaffType.ACCOUNTANT: "accountant",
    StaffApplication.StaffType.HR: "hr",
}


def _write_custom_field(user, key, value):
    from apps.custom_fields.models import CustomField, CustomFieldValue

    field = CustomField.objects.filter(entity=CustomField.Entity.STAFF, key=key, is_active=True).first()
    if not field or not value:
        return
    CustomFieldValue.objects.update_or_create(field=field, entity_id=user.id, defaults={"value": value})


def _provision_academic_staff(application, reviewer):
    from apps.rbac.models import Role, UserRole

    identifier = generate_number("staff")
    password = get_random_string(length=12)
    email = application.email or None
    if email and User.objects.filter(is_deleted=False, email__iexact=email).exists():
        email = None
    phone = application.phone or None
    if phone and User.objects.filter(is_deleted=False, phone=phone).exists():
        phone = None

    user = User.objects.create_user(
        email=email, phone=phone, identifier=identifier, full_name=application.full_name,
        user_type=User.UserType.STAFF, password=password,
    )

    role_slug = _ROLE_SLUG_BY_STAFF_TYPE[application.staff_type]
    role = Role.objects.filter(slug=role_slug, is_deleted=False).first()
    if role:
        UserRole.objects.get_or_create(user=user, role=role)

    _write_custom_field(user, "nin", application.nin)
    _write_custom_field(user, "qualification", application.qualification)

    conflict_notes = []
    if application.staff_type == StaffApplication.StaffType.TEACHER:
        conflict_notes = _apply_teacher_assignments(application, user)

    send_credentials_email(user, password, application.get_staff_type_display())
    return user, conflict_notes


def _apply_teacher_assignments(application, teacher_user):
    """Turns the teacher's subject/class claims into real
    ClassSubjectAssignment rows, and the form-teacher claim into a real
    ClassTeacherAssignment — for the currently active session. A slot
    someone else already holds is left untouched (never silently
    reassigned) and reported back so the reviewer sees it happened."""
    from apps.academics.models import ClassSubjectAssignment, ClassTeacherAssignment
    from apps.configuration.models import AcademicSession

    notes = []
    session = AcademicSession.objects.filter(is_current=True).first() or AcademicSession.objects.first()
    if not session:
        return ["No academic session exists yet — subject/class-teacher assignments were skipped."]

    for claim in application.subject_claims.select_related("subject", "class_arm__school_class").all():
        existing = ClassSubjectAssignment.objects.filter(
            class_arm=claim.class_arm, subject=claim.subject, session=session,
        ).first()
        label = f"{claim.subject.name} — {claim.class_arm.school_class.name} {claim.class_arm.name}"
        if existing and existing.teacher_id and existing.teacher_id != teacher_user.id:
            notes.append(f"Already assigned to {existing.teacher.full_name}, left unchanged: {label}.")
            continue
        if existing:
            existing.teacher = teacher_user
            existing.save(update_fields=["teacher"])
        else:
            ClassSubjectAssignment.objects.create(
                class_arm=claim.class_arm, subject=claim.subject, teacher=teacher_user, session=session,
            )

    if application.is_form_teacher and application.form_teacher_class_arm_id:
        arm = application.form_teacher_class_arm
        existing_ct = ClassTeacherAssignment.objects.filter(class_arm=arm, session=session).first()
        label = f"{arm.school_class.name} {arm.name}"
        if existing_ct and existing_ct.teacher_id != teacher_user.id:
            notes.append(f"Already has a form teacher ({existing_ct.teacher.full_name}), left unchanged: {label}.")
        elif not existing_ct:
            ClassTeacherAssignment.objects.create(class_arm=arm, teacher=teacher_user, session=session)

    return notes


def _provision_non_academic_staff(application, reviewer):
    from apps.finance.models import NonAcademicStaffPayout

    payout = NonAcademicStaffPayout.objects.create(
        full_name=application.full_name, title=application.non_academic_role_title,
        email=application.email, created_by=reviewer,
    )
    return payout


@transaction.atomic
def approve_staff_application(application, reviewer):
    """Idempotent: re-calling on an already-provisioned application is a
    safe no-op, returning what it already created."""
    if application.created_user_id:
        return application.created_user
    if application.created_payout_id:
        return application.created_payout

    conflict_notes = []
    if application.staff_type == StaffApplication.StaffType.NON_ACADEMIC:
        result = _provision_non_academic_staff(application, reviewer)
        application.created_payout = result
    else:
        result, conflict_notes = _provision_academic_staff(application, reviewer)
        application.created_user = result

    application.status = StaffApplication.Status.APPROVED
    application.reviewed_by = reviewer
    application.reviewed_at = timezone.now()
    if conflict_notes:
        note_text = " ".join(conflict_notes)
        application.review_notes = f"{application.review_notes}\n{note_text}".strip()
    application.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_notes", "created_user", "created_payout"])

    return result


def reject_staff_application(application, reviewer, notes=""):
    application.status = StaffApplication.Status.REJECTED
    application.reviewed_by = reviewer
    application.reviewed_at = timezone.now()
    application.review_notes = notes
    application.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_notes"])
