from django.contrib import admin

from .models import Application, ApplicationDocument

admin.site.register(Application)
admin.site.register(ApplicationDocument)
