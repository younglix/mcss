from django.core.management.base import BaseCommand

from apps.settings_app.models import SystemSetting

# (key, group, default value, is_secret) — spec Section 7's example keys,
# seeded empty/off so Super Admin fills them in via PATCH once providers
# are chosen; the API intentionally has no "create setting" endpoint, so
# every key the app expects to read must exist from this seed.
DEFAULT_SETTINGS = [
    ("sms.provider", "sms", "", False),
    ("sms.sender_id", "sms", "", False),
    ("sms.api_key", "sms", "", True),
    ("email.host", "email", "", False),
    ("email.port", "email", 587, False),
    ("email.username", "email", "", False),
    ("email.from", "email", "", False),
    ("email.password", "email", "", True),
    ("email.use_tls", "email", True, False),
    ("whatsapp.provider", "whatsapp", "", False),
    ("whatsapp.business_number", "whatsapp", "", False),
    ("whatsapp.api_key", "whatsapp", "", True),
    ("push.provider", "push", "", False),
    ("payments.paystack.public_key", "payments", "", False),
    ("payments.paystack.secret_key", "payments", "", True),
    ("payments.flutterwave.public_key", "payments", "", False),
    ("payments.flutterwave.secret_key", "payments", "", True),
    ("notifications.absentee_alert_enabled", "notifications", False, False),
    ("notifications.channels", "notifications", ["in_app"], False),
    ("notifications.retention_days", "notifications", 90, False),
    ("numbering.admission_format", "numbering", "MC/{year}/{seq:04}", False),
    ("numbering.receipt_format", "numbering", "RCT/{year}/{seq:05}", False),
    ("numbering.invoice_format", "numbering", "INV/{year}/{seq:05}", False),
    ("result.pass_mark", "result", 50, False),
    ("result.show_position", "result", True, False),
    ("result.lock_after_publish", "result", True, False),
    # General — locale/format defaults. Institutional identity (name, logo,
    # address, ...) lives on configuration.SchoolProfile, not here — this is
    # only the preferences that don't belong on that model.
    ("general.language", "general", "en", False),
    ("general.timezone", "general", "Africa/Lagos", False),
    ("general.currency", "general", "NGN", False),
    ("general.currency_symbol", "general", "₦", False),
    ("general.date_format", "general", "DD/MM/YYYY", False),
    ("general.time_format", "general", "24h", False),
    ("general.number_format", "general", "1,234.56", False),
    ("general.default_country_code", "general", "+234", False),
    # Appearance — theme colors/typography (genuinely applied at runtime via
    # CSS custom-property overrides, see frontend ThemeContext) and brand
    # image variants beyond SchoolProfile's single `logo`.
    ("appearance.primary_color", "appearance", "#2e004a", False),
    ("appearance.secondary_color", "appearance", "#364186", False),
    ("appearance.radius_scale", "appearance", "default", False),
    ("appearance.primary_font", "appearance", "Arimo", False),
    ("appearance.body_font", "appearance", "Archivo Narrow", False),
    ("appearance.heading_font", "appearance", "Arimo", False),
    ("appearance.base_font_size", "appearance", 16, False),
    ("appearance.light_logo", "appearance", "", False),
    ("appearance.dark_logo", "appearance", "", False),
    ("appearance.landscape_logo", "appearance", "", False),
    ("appearance.school_seal", "appearance", "", False),
    ("appearance.pdf_branding_enabled", "appearance", True, False),
    ("appearance.report_branding_enabled", "appearance", True, False),
    ("appearance.invoice_branding_enabled", "appearance", True, False),
    ("appearance.certificate_branding_enabled", "appearance", True, False),
    # More numbering formats (genuinely consumed — see settings_app/numbering.py
    # and its call sites in academics.StudentCreateSerializer, the new
    # apps.admissions app, and apps.finance's Invoice/Payment/Expense .save()).
    ("numbering.application_format", "numbering", "APP/{year}/{seq:05}", False),
    ("numbering.staff_format", "numbering", "STF/{year}/{seq:04}", False),
    ("numbering.expense_format", "numbering", "EXP/{year}/{seq:05}", False),
    # Registration Number — generated once the first school fee clears (see
    # apps.finance.models._maybe_generate_registration_number), distinct
    # from the Student ID (numbering.admission_format, generated at
    # admission approval).
    ("numbering.registration_format", "numbering", "REG/{year}/{seq:04}", False),
    # Academic — rules/defaults, not a duplicate of the real academic records
    # (grading scale is configuration.GradeScale, current session/term is
    # configuration.AcademicSession/Term — both linked to from this settings
    # page, not re-stored here).
    ("academic.gpa_enabled", "academic", False, False),
    ("academic.gpa_scale", "academic", "5.0", False),
    ("academic.score_calculation", "academic", "weighted_average", False),
    ("academic.attendance_min_percent", "academic", 75, False),
    ("academic.promotion_min_average", "academic", 40, False),
    ("academic.graduation_min_average", "academic", 40, False),
    ("academic.exam_retakes_allowed", "academic", False, False),
    # Student & Admission
    ("student_admission.guardian_required", "student_admission", True, False),
    ("student_admission.required_documents", "student_admission", "Birth Certificate, Passport Photograph, Previous Report Card", False),
    ("student_admission.admission_requirements", "student_admission", "", False),
    # Admission window — Super Admin now creates/controls this instead of
    # the public Apply form always being live. is_open is the master
    # switch; defaults closed on first seed so a fresh deploy doesn't
    # silently reopen applications until someone deliberately turns it on.
    ("student_admission.is_open", "student_admission", False, False),
    ("student_admission.opens_at", "student_admission", "", False),
    ("student_admission.closes_at", "student_admission", "", False),
    ("student_admission.session", "student_admission", "", False),
    # Staff & HR
    ("staff_hr.employment_types", "staff_hr", "Full-time, Part-time, Contract", False),
    ("staff_hr.working_hours", "staff_hr", "8:00 AM - 4:00 PM", False),
    ("staff_hr.leave_days_annual", "staff_hr", 21, False),
    ("staff_hr.leave_days_sick", "staff_hr", 10, False),
    ("staff_hr.default_tax_rate", "staff_hr", 0, False),
    # Finance — fee/payment policy defaults. Actual fee amounts live on
    # finance.FeeStructure; this is global policy, not a second fee table.
    ("finance.late_fee_percent", "finance", 0, False),
    ("finance.late_fee_grace_days", "finance", 0, False),
    ("finance.financial_year_start_month", "finance", 1, False),
    ("finance.default_discount_percent", "finance", 0, False),
    ("finance.tax_percent", "finance", 0, False),
    # A flat fee (unlike school fees, which already vary by class via
    # FeeStructure) charged on admission acceptance — read by
    # apps.admissions.services.approve_application when it opens the
    # Acceptance Fee invoice.
    ("finance.acceptance_fee_amount", "finance", 0, False),
    # Users & Security — genuinely enforced: password policy feeds
    # apps.accounts.validators.ConfigurablePasswordValidator (wired into
    # AUTH_PASSWORD_VALIDATORS, so it applies to every password entry
    # point), login-attempt limits and the notify flag drive LoginView's
    # rolling-window lockout, and session timeout controls issued JWT
    # access-token lifetime (see apps.accounts.authentication). Role
    # definitions themselves are NOT duplicated here — see Roles & Permissions.
    ("security.password_min_length", "security", 8, False),
    ("security.password_require_uppercase", "security", False, False),
    ("security.password_require_number", "security", False, False),
    ("security.password_require_symbol", "security", False, False),
    ("security.max_login_attempts", "security", 5, False),
    ("security.lockout_duration_minutes", "security", 15, False),
    ("security.session_timeout_minutes", "security", "", False),
    ("security.notify_on_failed_login", "security", True, False),
    # System & Maintenance — maintenance_enabled is read by
    # apps.settings_app.middleware.MaintenanceModeMiddleware on every
    # request, so toggling it here genuinely blocks non-superadmin access
    # rather than just recording a preference.
    ("system.maintenance_enabled", "system", False, False),
    ("system.maintenance_message", "system", "The system is currently under maintenance. Please check back soon.", False),
    # Website — SEO/social metadata for the public site; institutional
    # identity (name, logo, address) stays on configuration.SchoolProfile,
    # and page content stays on apps.cms.SiteAnnouncement — this is neither.
    ("website.meta_title", "website", "", False),
    ("website.meta_description", "website", "", False),
    ("website.social_facebook", "website", "", False),
    ("website.social_twitter", "website", "", False),
    ("website.social_instagram", "website", "", False),
    ("website.footer_text", "website", "", False),
    # Landing-page layout content — seeded with the same copy the page
    # already shipped with (previously hardcoded in frontend landingData.js)
    # so seeding this is a no-op visually; only editing a field in Website
    # settings changes what the public site shows.
    ("website.banner_enabled", "website", True, False),
    ("website.banner_text", "website", "Admissions for the 2024/2025 academic session are currently ongoing.", False),
    ("website.banner_cta", "website", "Apply Online Now", False),
    ("website.hero_eyebrow", "website", "Founded in Faith • Rooted in Excellence", False),
    ("website.hero_title", "website", "Divine Wisdom", False),
    ("website.hero_title_accent", "website", "is Wealth.", False),
    ("website.hero_body", "website", "At Mount Carmel Secondary, we blend storied Catholic traditions with rigorous technical precision. Our mission is to mold leaders who carry both the light of wisdom and the strength of character.", False),
    ("website.hero_image", "website", "https://lh3.googleusercontent.com/aida-public/AB6AXuDouJ-CkRkpM1fizV5IKwOjVoSKooPQOMVu9DXeByuz7-IQVW4vH5s43x6EiABw9tLp03iMzM-P6kV1EGx1IjIwJA8K0kmfw72KzGyksyQlnnqJ26YfjzKzo1TMr0-5JUaHlW45YLnol8_RlcPHUWm1w1UigK_TT90KhiGoeAIrQ31DJAiV2S-yh6YXWIMSas4uGE9dwl0p_9G5nuT7jddIoG5KXEAgEH9PWeRXP42Jl2HNddS9xlEgkHlH3Do8UUnp-EkrO_R_Rzsx", False),
    ("website.hero_stat_value", "website", "100%", False),
    ("website.hero_stat_label", "website", "WAEC Success Rate", False),
    ("website.about_eyebrow", "website", "Institutional Heritage", False),
    ("website.about_title", "website", "A Legacy of Catholic", False),
    ("website.about_title_accent", "website", "Prestige & Learning", False),
    ("website.about_body", "website", "Mount Carmel Secondary School stands as a testament to the enduring power of Catholic education. Founded on the principles of the Carmelite tradition, we provide a structured environment where students are encouraged to seek truth, practice charity, and pursue academic rigor.", False),
    ("website.about_image1", "website", "https://lh3.googleusercontent.com/aida-public/AB6AXuDItye1aM7pswGnhSj9dDMPcGK67jWkrhvoRxL3ZoxgKIMMHkjM02U_JVupuRy5GDM6WvPLWFtyNw9qhItbikbdyIqWWEGfD-vyVcC_SZ3n0hXQxSgTuMJGBXvMOpsxjZFsczhc9Rx8UUJT6TSuip_99UZZ1IIQPy9dxYpKiP7Ygt7eLK2nRLyc7v45qQMKZeWj2kI4zMftfaqvL6CSBJ_NONqOgcrEIy20rGLzqo9hacsw8l1UHGek2sskldF5dCUnGnMeKU7mPJpN", False),
    ("website.about_image2", "website", "https://lh3.googleusercontent.com/aida-public/AB6AXuCuUz9RyRjMWfluZX4V-YEx6BXjYaJMjaP-H8a24SY18o-aD8twRTqhjhFZ1VEIZRebFTCY9YfMf73dzdgEQyYk7rZUY0qxAneYlf9K7TZC13Lh3NJKlC1L-iLHJjz4BwVyTti7YteOlYUtHDijn41w8bpYyiIJ3pqwMuG06SrAIt-mgXvStS4RhUwXV0grkjKiCVPv5KaiJBssIL3kZEfltDqz91hnUA9psqTs8Qm9XO5-euz072EFJ9IfmrUnGx1ZnbNtGve88R39", False),
    ("website.about_points", "website", [
        {"icon": "auto_stories", "title": "Spiritual Formation", "body": "Daily mass and regular retreats for soul-building."},
        {"icon": "science", "title": "Technical Precision", "body": "State-of-the-art STEM laboratories and coding hubs."},
        {"icon": "diversity_1", "title": "Character Mentorship", "body": "Personal tutors for every student's growth path."},
    ], False),
    ("website.academics_eyebrow", "website", "Academic Programs", False),
    ("website.academics_title", "website", "Structured for Mastery", False),
    ("website.academics_programs", "website", [
        {"icon": "menu_book", "grades": "Grades 7 - 9", "name": "Junior Secondary School",
         "body": "Establishing a solid foundation in core sciences, humanities, and spiritual doctrine. We focus on discovery and discipline.",
         "tag": "12 Subjects Curriculum"},
        {"icon": "experiment", "grades": "Grades 10 - 12", "name": "Senior Secondary School",
         "body": "Specialized tracks in Science, Commercial, and Arts. Preparing students for global university entrance and professional life.",
         "tag": "UTME & WAEC Preparation"},
    ], False),
    ("website.fees_title", "website", "Investment in", False),
    ("website.fees_title_accent", "website", "Their Future", False),
    ("website.fees_body", "website", "Transparent fee structure with multiple payment options. We offer merit-based scholarships for exceptionally gifted students.", False),
    ("website.gallery_title", "website", "The Carmel Experience", False),
    ("website.gallery_body", "website", "A glimpse into the life, culture, and facilities that define our institution.", False),
    ("website.gallery_images", "website", [
        {"url": "https://lh3.googleusercontent.com/aida-public/AB6AXuA6y1DzymhVUKktHrrTBOyIQ98dDBNpIXX0DJ7PDYAKDtHqn98fp5dkmkZGKq1q0vfKMCsbRiGu0Yx7PioaZKkn84kmADBarJ7-SFjtsbk3qmPQTEJpd5J2eRnCY9PZ_62fMIGrouNiG6FJa20_HgYbN6chsZ8CC6ToWDqcsc4FgX2FuIsNwUfB23cquxnf5R0WM2YqFYbtIsTn-sr5KK3yPJlO8A4ZzPQkE14__p545c4fF3pVOWaHq1WDCs0f2QkjgjqfxRAFE1XW", "label": "Innovation Labs"},
        {"url": "https://lh3.googleusercontent.com/aida-public/AB6AXuBsmi0JlBO0VdCDNswteLQjqlWIRzXnPbiqSf9I4P9rWVECVOeSkFewGDhEhYlDnqyeEGGgA2Ikclth5DBGu4MbpQqj_o6BP2lMCvENBZJLgOkC-BZ69nJn4nmTJt6Q6bTtCB2ttRUr4DuB8Yyem2nrW0n24Y0kzI2xfJ7i3QVhHse_5Puy0XSkSjzamNCeTMyElNf8fyYpe40NgVtYTUocmtoj_1fWZ6g2tfq_LmIgmrhoe4aOe2T5x0tcxQVTaCJJ5dVs95vN6BQ5", "label": "Sports Complex"},
        {"url": "https://lh3.googleusercontent.com/aida-public/AB6AXuCV3nC3B1VIB1eN9cLHav96wrTLscREzAogs3qhEGgKKKc4ASdHSEzu6pLp0_XHVGe9uXv5KBDwGb9Zdrnbs3YSibBQlKyrotAwWjixRfWwWzBOzrqe6RYet6yqphtWV7po1faXUAJCx_WanIMUBs0FqW2FH9JGU0KOTBpOrpIqk9mpZV6yUjK0VJsO_2A2mvvYx7ctCAycShxTF5Q4EVW2d1qINe1uK_emSnMjk3LRWZLYS3nndcGyZRp4vlzSqld5CLNX5ULWDd0W", "label": "Sacred Spaces"},
    ], False),
    ("exam.min_bank_size", "exam", 150, False),
]


class Command(BaseCommand):
    help = "Seeds the default system-setting keys (empty/off) so PATCH/bulk endpoints have rows to update."

    def handle(self, *args, **options):
        created = 0
        for key, group, default_value, is_secret in DEFAULT_SETTINGS:
            if SystemSetting.objects.filter(key=key).exists():
                continue
            setting = SystemSetting(key=key, group=group, is_secret=is_secret)
            setting.set_value(default_value)
            setting.save()
            created += 1
        self.stdout.write(self.style.SUCCESS(f"Seeded {created} new setting(s)."))
