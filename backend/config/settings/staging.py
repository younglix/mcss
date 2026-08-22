"""
Production-hardened settings (DEBUG off, real secrets required) but served
over plain HTTP by IP address until a domain + TLS cert is in place. Once
that happens, point DJANGO_SETTINGS_MODULE at prod.py instead — it's
identical except for the HTTPS-enforcing directives below.
"""
from .base import *  # noqa: F401,F403

DEBUG = False
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[])

SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
