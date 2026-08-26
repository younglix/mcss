from django.contrib import admin

from .models import (
    Asset,
    InventoryItem,
    InventoryTransaction,
    JobApplication,
    JobPosting,
    LeaveRequest,
    StaffDocument,
)

admin.site.register(LeaveRequest)
admin.site.register(StaffDocument)
admin.site.register(JobPosting)
admin.site.register(JobApplication)
admin.site.register(InventoryItem)
admin.site.register(InventoryTransaction)
admin.site.register(Asset)
