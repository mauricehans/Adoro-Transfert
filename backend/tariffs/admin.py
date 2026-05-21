from django.contrib import admin

from .models import FeesGrid, Settings


@admin.register(FeesGrid)
class FeesGridAdmin(admin.ModelAdmin):
    list_display = ("corridor", "currency", "min_amount", "max_amount", "fee_amount", "fee_percent", "active")
    list_filter = ("corridor", "currency", "active")
    ordering = ("corridor", "min_amount")


@admin.register(Settings)
class SettingsAdmin(admin.ModelAdmin):
    list_display = ("key", "value", "is_public", "updated_at", "updated_by")
    list_filter = ("is_public",)
    search_fields = ("key", "description")
    readonly_fields = ("updated_at",)
