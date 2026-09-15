from django.db import models

from common.models import BaseModel


class SchoolProfile(BaseModel):
    name = models.CharField(max_length=200)
    short_name = models.CharField(max_length=50, blank=True)
    # Plain CharField, not URLField: a locally-stored upload (before S3 keys
    # are configured) resolves to a relative /media/... path, which
    # URLField's absolute-URL validator would reject outright.
    logo = models.CharField(max_length=500, blank=True)
    favicon = models.CharField(max_length=500, blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    country = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    motto = models.CharField(max_length=200, blank=True)
    # Scanned principal's signature, shown on the printable/PDF report card
    # next to PRINCIPAL'S SIGNATURE — same locally-stored-upload convention
    # as `logo` above (a relative /media/... path, not a URLField).
    principal_signature = models.CharField(max_length=500, blank=True)

    class Meta(BaseModel.Meta):
        pass

    def __str__(self):
        return self.name


class AcademicSession(BaseModel):
    name = models.CharField(max_length=20, unique=True)   # "2026/2027"
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta(BaseModel.Meta):
        ordering = ["-start_date"]

    def __str__(self):
        return self.name


class Term(BaseModel):
    session = models.ForeignKey(AcademicSession, on_delete=models.CASCADE, related_name="terms")
    name = models.CharField(max_length=30)   # "First", "Second", "Third"
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta(BaseModel.Meta):
        ordering = ["start_date"]
        unique_together = ("session", "name")

    def __str__(self):
        return f"{self.name} Term — {self.session.name}"


class Department(BaseModel):
    name = models.CharField(max_length=100, unique=True)

    class Meta(BaseModel.Meta):
        ordering = ["name"]

    def __str__(self):
        return self.name


class SchoolClass(BaseModel):
    name = models.CharField(max_length=50, unique=True)   # "JSS 1", "SS 2"
    level_order = models.PositiveIntegerField()             # drives promotion ordering

    class Meta(BaseModel.Meta):
        ordering = ["level_order"]

    def __str__(self):
        return self.name


class ClassArm(BaseModel):
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name="arms")
    name = models.CharField(max_length=10)   # "A", "B"
    # Performance-reallocation band capacity, and a strict ratchet: only N_S
    # absorption ever raises it (see apps.academics.services), never the
    # re-rank. Null = uncapped. It must NOT be editable through the generic
    # config arm endpoint — the only writer is the audited
    # reallocation.configure endpoint, so a hand-edit can't silently break
    # the ratchet rule.
    capacity = models.PositiveIntegerField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["school_class__level_order", "name"]
        unique_together = ("school_class", "name")

    def __str__(self):
        return f"{self.school_class.name} {self.name}"


class GradeScale(BaseModel):
    name = models.CharField(max_length=50)          # "A1", "B2"...
    min_score = models.PositiveIntegerField()
    max_score = models.PositiveIntegerField()
    remark = models.CharField(max_length=50)         # "Excellent"
    grade_point = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["-max_score"]

    def __str__(self):
        return f"{self.name} ({self.min_score}-{self.max_score})"


class SiteMedia(BaseModel):
    """One Super-Admin-uploaded image or video for a named spot on a public
    page — the login page's desktop slider, a landing-page section (hero,
    about, a feature card), or the school album. One shared model/CRUD
    instead of a separate one-off system per spot: every one of these is
    the same shape (an ordered list of media for a named placement), they
    just differ in which `placement` they're filtered to and how the
    frontend renders that placement's list."""

    class Placement(models.TextChoices):
        LOGIN_SLIDER = "login_slider", "Login Page Slider"
        HERO = "hero", "Landing Hero"
        ABOUT_1 = "about_1", "About Image 1"
        ABOUT_2 = "about_2", "About Image 2"
        CARD = "card", "Feature Card"
        GALLERY_1 = "gallery_1", "Gallery 1"
        GALLERY_2 = "gallery_2", "Gallery 2"
        GALLERY_3 = "gallery_3", "Gallery 3"
        ALBUM = "album", "School Album"

    class MediaType(models.TextChoices):
        IMAGE = "image", "Image"
        VIDEO = "video", "Video"

    placement = models.CharField(max_length=20, choices=Placement.choices)
    media_type = models.CharField(max_length=10, choices=MediaType.choices, default=MediaType.IMAGE)
    url = models.CharField(max_length=500)
    caption = models.CharField(max_length=200, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta(BaseModel.Meta):
        ordering = ["placement", "order"]

    def __str__(self):
        return f"{self.get_placement_display()} — {self.url}"


class FeeCategory(BaseModel):
    class RestrictionType(models.TextChoices):
        """What an unpaid/partial invoice against this category blocks —
        "none" for the ordinary case (a plain fee item with no functional
        consequence beyond owing money). Each of the others corresponds to a
        real, enforceable gate somewhere in the app — see
        apps.finance.services.restriction_check for exactly what triggers
        each one and apps.finance.services.RESTRICTION_DESCRIPTIONS for the
        student-facing explanation of each."""
        NONE = "none", "No restriction"
        ACTIVE_STUDENT = "active_student", "Active Student status (blocks broad academic activity)"
        LIBRARY = "library", "Library (blocks new book loans)"
        HOSTEL = "hostel", "Hostel (blocks hostel room allocation)"
        TRANSPORT = "transport", "Transport (blocks school bus/route assignment)"
        CERTIFICATE = "certificate", "Certificate/Result (blocks report card & result downloads)"
        ACTIVITY = "activity", "Activity Participation (blocks joining school activities/events)"

    name = models.CharField(max_length=100, unique=True)   # "Tuition", "ICT", "Development"
    is_recurring = models.BooleanField(default=True)
    # The standard/default price for this fee item — e.g. "Sportswear" =
    # 1000. Distinct from FeeStructure.amount, which prices a category per
    # class/session/term for bulk school-fees generation; this is the flat
    # price used when a staff member charges a one-off ticket to a student
    # directly from the catalog, no session/class scoping required.
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    restriction_type = models.CharField(max_length=20, choices=RestrictionType.choices, default=RestrictionType.NONE, blank=True)

    class Meta(BaseModel.Meta):
        ordering = ["name"]

    def __str__(self):
        return self.name
