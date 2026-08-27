from celery import shared_task
from django.contrib.auth import get_user_model

from .channels import email, push, sms, whatsapp

User = get_user_model()


@shared_task
def send_email(recipient_id, title, body):
    user = User.objects.filter(id=recipient_id).first()
    if user:
        email.send(user, title, body)


@shared_task
def send_sms(recipient_id, body):
    user = User.objects.filter(id=recipient_id).first()
    if user:
        sms.send(user, body)


@shared_task
def send_push(recipient_id, title, body):
    user = User.objects.filter(id=recipient_id).first()
    if user:
        push.send(user, title, body)


@shared_task
def send_whatsapp(recipient_id, body):
    user = User.objects.filter(id=recipient_id).first()
    if user:
        whatsapp.send(user, body)


@shared_task
def send_credentials_email_task(recipient_id, plain_password, portal_label, delivery_email):
    user = User.objects.filter(id=recipient_id).first()
    if not user or not delivery_email:
        return
    # The real login handle — email if the account has one, else the
    # Student ID/identifier — not necessarily the same address this is
    # being delivered to (a young student's credentials often go to their
    # guardian's inbox instead).
    login_handle = user.email or user.identifier or user.phone
    subject = f"Your {portal_label} Portal Login"
    body = (
        f"Hello {user.full_name},\n\n"
        f"Your {portal_label.lower()} portal account has been created.\n\n"
        f"Login: {login_handle}\n"
        f"Temporary password: {plain_password}\n\n"
        "Please log in and change your password as soon as possible."
    )
    email.send_raw(delivery_email, subject, body)
