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
