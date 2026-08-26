from django.contrib import admin

from .models import Expense, FeeStructure, Invoice, Payment, PayrollRun, Payslip, StaffSalary

admin.site.register(FeeStructure)
admin.site.register(Invoice)
admin.site.register(Payment)
admin.site.register(Expense)
admin.site.register(StaffSalary)
admin.site.register(PayrollRun)
admin.site.register(Payslip)
