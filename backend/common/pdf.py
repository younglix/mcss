"""Shared helpers for the app's xhtml2pdf-rendered documents (report card,
payment receipt, ...)."""


def absolute_media_url(request, path):
    """xhtml2pdf fetches <img src> values as real HTTP requests (or local
    file reads) — it has no browser-style "resolve relative to the current
    page" behavior, so a bare relative path like "/mcss-logo.png" or
    "/media/logos/x.png" (as stored on SchoolProfile.logo, deliberately a
    plain CharField so either shape is valid) silently fails to load. This
    makes it absolute against the current request's own host, which works
    whether the path is Django-served (/media/...) or served by the SPA
    build sitting behind the same nginx (everything in this app is one
    origin — see README/deploy notes), exactly like a browser would resolve
    it. Already-absolute URLs (S3, a CDN, ...) pass through unchanged."""
    if not path or path.startswith(("http://", "https://", "data:")):
        return path or ""
    return request.build_absolute_uri(path)
