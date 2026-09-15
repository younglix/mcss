from django.test import RequestFactory, TestCase

from .pdf import absolute_media_url


class AbsoluteMediaUrlTests(TestCase):
    """xhtml2pdf makes a real HTTP/file fetch for <img src> — a bare
    relative path like SchoolProfile.logo's "/mcss-logo.png" (a plain
    CharField, deliberately allowing either a Django-served /media/... path
    or an SPA-served static asset path) silently fails to load unless it's
    first made absolute against the current request's host."""

    def setUp(self):
        self.request = RequestFactory().get("/")  # Host: testserver — Django's test-default allowed host

    def test_relative_path_becomes_absolute_against_the_request_host(self):
        self.assertEqual(absolute_media_url(self.request, "/mcss-logo.png"), "http://testserver/mcss-logo.png")

    def test_media_path_becomes_absolute_too(self):
        self.assertEqual(absolute_media_url(self.request, "/media/avatars/x.jpg"), "http://testserver/media/avatars/x.jpg")

    def test_already_absolute_http_url_passes_through_unchanged(self):
        url = "https://cdn.example.com/logo.png"
        self.assertEqual(absolute_media_url(self.request, url), url)

    def test_data_uri_passes_through_unchanged(self):
        uri = "data:image/png;base64,AAAA"
        self.assertEqual(absolute_media_url(self.request, uri), uri)

    def test_empty_or_none_returns_empty_string(self):
        self.assertEqual(absolute_media_url(self.request, ""), "")
        self.assertEqual(absolute_media_url(self.request, None), "")
