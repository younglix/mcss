from django.db import transaction

from .models import AcademicSession, Term


@transaction.atomic
def set_current_session(session_id):
    """
    Exactly one AcademicSession may be current at a time — almost every
    later module reads "current session" so this must be race-free.
    """
    session = AcademicSession.objects.select_for_update().get(id=session_id)
    AcademicSession.objects.exclude(id=session_id).filter(is_current=True).update(is_current=False)
    session.is_current = True
    session.save(update_fields=["is_current"])
    return session


@transaction.atomic
def set_current_term(term_id):
    term = Term.objects.select_for_update().get(id=term_id)
    Term.objects.exclude(id=term_id).filter(session=term.session, is_current=True).update(is_current=False)
    term.is_current = True
    term.save(update_fields=["is_current"])
    return term


def get_current_session():
    return AcademicSession.objects.filter(is_current=True).first()


def get_current_term():
    return Term.objects.filter(is_current=True).first()
