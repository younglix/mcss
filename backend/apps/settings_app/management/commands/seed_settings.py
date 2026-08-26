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
