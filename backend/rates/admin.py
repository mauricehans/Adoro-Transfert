from django.contrib import admin

from .models import RatesHistory


@admin.register(RatesHistory)
class RatesHistoryAdmin(admin.ModelAdmin):
    list_display = ("date", "source", "base_currency", "fetched_at")
    list_filter = ("source", "date")
    ordering = ("-date",)
    readonly_fields = ("fetched_at",)
