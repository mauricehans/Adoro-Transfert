from django.conf import settings
from django.db import models


class FeesGrid(models.Model):
    """Fee schedule based on corridor, currency, and amount range."""

    corridor = models.CharField(
        max_length=10,
        help_text="Transfer corridor (e.g., EUR_XAF, EUR_XOF)",
    )
    currency = models.CharField(
        max_length=3,
        default="EUR",
        help_text="Currency for the amount range",
    )
    min_amount = models.DecimalField(max_digits=10, decimal_places=2)
    max_amount = models.DecimalField(max_digits=10, decimal_places=2)
    fee_amount = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
        help_text="Fixed fee in EUR",
    )
    fee_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Percentage fee (e.g., 2.50 for 2.5%)",
    )
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["corridor", "min_amount"]
        verbose_name = "Fees Grid"
        verbose_name_plural = "Fees Grid"

    def __str__(self):
        return (
            f"{self.corridor} | {self.min_amount}-{self.max_amount} {self.currency} | "
            f"{self.fee_amount}EUR + {self.fee_percent}%"
        )


class Settings(models.Model):
    """Key-value settings store for application configuration."""

    key = models.CharField(max_length=100, primary_key=True)
    value = models.JSONField()
    description = models.TextField(blank=True)
    is_public = models.BooleanField(
        default=False,
        help_text="If True, this setting is accessible without authentication",
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["key"]
        verbose_name = "Setting"
        verbose_name_plural = "Settings"

    def __str__(self):
        return f"{self.key} = {self.value}"
