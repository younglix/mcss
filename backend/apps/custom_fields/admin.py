from django.contrib import admin

from .models import CustomField, CustomFieldValue

admin.site.register(CustomField)
admin.site.register(CustomFieldValue)
