from django.conf import settings
from django.db import models


class AdminAudit(models.Model):
    """Audit log for admin actions and notifications sent."""

    class Action(models.TextChoices):
        EMAIL_SENT = "email_sent", "Email Sent"
        WHATSAPP_SENT = "whatsapp_sent", "WhatsApp Sent"
        STATUS_CHANGE = "status_change", "Status Change"
        SETTINGS_UPDATE = "settings_update", "Settings Update"
        RATES_REFRESH = "rates_refresh", "Rates Refresh"

    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=30, choices=Action.choices)
    target = models.CharField(
        max_length=255,
        blank=True,
        help_text="Target object identifier (e.g., transaction ID)",
    )
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Admin Audit"
        verbose_name_plural = "Admin Audits"

    def __str__(self):
        return f"{self.action} - {self.target} ({self.created_at:%Y-%m-%d %H:%M})"
