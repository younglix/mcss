from rest_framework import serializers

from apps.configuration.models import AcademicSession, SchoolClass, Term

from .models import Expense, FeeStructure, Invoice, Payment, PayrollRun, Payslip, StaffSalary


class FeeStructureSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    class_name = serializers.CharField(source="school_class.name", read_only=True, default=None)
    session_name = serializers.CharField(source="session.name", read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True, default=None)

    class Meta:
        model = FeeStructure
        fields = [
            "id", "category", "category_name", "school_class", "class_name",
            "session", "session_name", "term", "term_name", "amount",
        ]
        read_only_fields = ["id"]
        # school_class/term are optionally-null ("applies to all"/"applies to
        # the whole session") on the model, but DRF's auto UniqueTogetherValidator
        # (from Meta.unique_together) forces every field it covers to be
        # required regardless — override both explicitly and do the
        # uniqueness check by hand in validate() instead.
        extra_kwargs = {"school_class": {"required": False}, "term": {"required": False}}
        validators = []

    def validate(self, attrs):
        category = attrs.get("category", getattr(self.instance, "category", None))
        school_class = attrs.get("school_class", getattr(self.instance, "school_class", None))
        session = attrs.get("session", getattr(self.instance, "session", None))
        term = attrs.get("term", getattr(self.instance, "term", None))
        qs = FeeStructure.objects.filter(category=category, school_class=school_class, session=session, term=term)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError("A fee structure already exists for this exact category/class/session/term.")
        return attrs


class InvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    class_arm_label = serializers.SerializerMethodField()
    amount_paid = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id", "invoice_number", "student", "student_name", "class_arm_label", "fee_structure", "purpose",
            "description", "session", "term", "amount", "amount_paid", "balance", "due_date", "status", "created_at",
        ]
        read_only_fields = ["id", "invoice_number", "amount_paid", "balance", "status", "created_at"]

    def get_class_arm_label(self, obj):
        return str(obj.student.class_arm) if obj.student.class_arm else None


class SchoolFeesGenerateSerializer(serializers.Serializer):
    """Bulk-generate invoices for every active student in a class, from the
    fee structures that apply to it for the given session/term."""

    school_class = serializers.PrimaryKeyRelatedField(queryset=SchoolClass.objects.all())
    session = serializers.PrimaryKeyRelatedField(queryset=AcademicSession.objects.all())
    term = serializers.PrimaryKeyRelatedField(queryset=Term.objects.all(), required=False, allow_null=True)


class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="invoice.student.user.full_name", read_only=True)
    invoice_description = serializers.CharField(source="invoice.description", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id", "invoice", "student_name", "invoice_description", "amount", "method",
            "reference", "receipt_number", "status", "paid_at", "recorded_by",
        ]
        read_only_fields = ["id", "receipt_number", "status", "recorded_by", "paid_at"]

    def validate(self, attrs):
        invoice = attrs.get("invoice")
        amount = attrs.get("amount")
        if invoice and amount is not None and amount > invoice.balance:
            raise serializers.ValidationError({"amount": f"Exceeds the outstanding balance of {invoice.balance}."})
        return attrs


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ["id", "expense_number", "category", "description", "amount", "date", "paid_to", "recorded_by"]
        read_only_fields = ["id", "expense_number", "recorded_by"]


class StaffSalarySerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source="staff.full_name", read_only=True)

    class Meta:
        model = StaffSalary
        fields = ["id", "staff", "staff_name", "basic_salary", "allowances", "deductions"]
        read_only_fields = ["id"]


class PayslipSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source="staff.full_name", read_only=True)

    class Meta:
        model = Payslip
        fields = ["id", "run", "staff", "staff_name", "basic_salary", "allowances", "deductions", "net_pay"]
        read_only_fields = fields


class PayrollRunSerializer(serializers.ModelSerializer):
    run_by_name = serializers.CharField(source="run_by.full_name", read_only=True, default=None)
    approved_by_name = serializers.CharField(source="approved_by.full_name", read_only=True, default=None)
    payslips = PayslipSerializer(many=True, read_only=True)
    total_net_pay = serializers.SerializerMethodField()

    class Meta:
        model = PayrollRun
        fields = [
            "id", "month", "year", "status", "run_by", "run_by_name",
            "approved_by", "approved_by_name", "approved_at", "payslips", "total_net_pay", "created_at",
        ]
        read_only_fields = ["id", "status", "run_by", "approved_by", "approved_at", "payslips", "total_net_pay", "created_at"]

    def get_total_net_pay(self, obj):
        return sum((p.net_pay for p in obj.payslips.all()), start=0)
