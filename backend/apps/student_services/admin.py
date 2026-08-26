from django.contrib import admin

from .models import (
    Activity,
    ActivityParticipant,
    Book,
    BookLoan,
    HealthIncident,
    HealthRecord,
    HostelAllocation,
    HostelBlock,
    HostelRoom,
    MealMenu,
    StudentResource,
    TransportAssignment,
    TransportRoute,
    Vehicle,
)

admin.site.register(Book)
admin.site.register(BookLoan)
admin.site.register(HostelBlock)
admin.site.register(HostelRoom)
admin.site.register(HostelAllocation)
admin.site.register(TransportRoute)
admin.site.register(Vehicle)
admin.site.register(TransportAssignment)
admin.site.register(MealMenu)
admin.site.register(Activity)
admin.site.register(ActivityParticipant)
admin.site.register(StudentResource)
admin.site.register(HealthRecord)
admin.site.register(HealthIncident)
