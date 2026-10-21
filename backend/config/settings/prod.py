from .base import *  # noqa: F401,F403

DEBUG = False
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[])
# Needed for the Django admin's login form whenever the site is reached at an
# origin Django doesn't already trust (e.g. "http://169.58.243.48").
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# MCSS_HTTPS=false is ONLY for running on a bare IP address before a domain
# (and so a TLS certificate) exists: browsers won't send Secure cookies over
# plain HTTP, and an HTTPS redirect would point at a certificate that isn't
# there. Flip it back to true (the default) as soon as the domain is live.
MCSS_HTTPS = env.bool("MCSS_HTTPS", default=True)

SECURE_SSL_REDIRECT = MCSS_HTTPS
SESSION_COOKIE_SECURE = MCSS_HTTPS
CSRF_COOKIE_SECURE = MCSS_HTTPS
if MCSS_HTTPS:
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
