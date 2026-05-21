from django.contrib import admin

from .models import AdminAudit


@admin.register(AdminAudit)
class AdminAuditAdmin(admin.ModelAdmin):
    list_display = ("action", "target", "admin", "created_at")
    list_filter = ("action", "created_at")
    search_fields = ("target", "admin__username")
    readonly_fields = ("admin", "action", "target", "payload", "created_at")
    ordering = ("-created_at",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
