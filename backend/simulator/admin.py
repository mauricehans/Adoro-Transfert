from django.contrib import admin

from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        "short_id",
        "corridor",
        "amount_sent",
        "amount_received",
        "beneficiary_name",
        "status",
        "created_at",
    )
    list_filter = ("status", "corridor", "created_at")
    search_fields = ("beneficiary_name", "beneficiary_phone")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)

    def short_id(self, obj):
        return str(obj.id)[:8]

    short_id.short_description = "ID"
