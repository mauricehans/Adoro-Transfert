from django.db import models


class RatesHistory(models.Model):
    """Historical exchange rates fetched from external sources."""

    class Source(models.TextChoices):
        EXCHANGERATE_HOST = "exchangerate_host", "exchangerate.host"
        FRANKFURTER = "frankfurter", "frankfurter.dev"
        STATIC = "static", "Static (fixed FCFA rate)"

    date = models.DateField()
    fetched_at = models.DateTimeField(auto_now_add=True)
    source = models.CharField(max_length=30, choices=Source.choices)
    base_currency = models.CharField(max_length=3, default="EUR")
    rates = models.JSONField(
        help_text="JSON object with currency codes as keys and rates as values"
    )

    class Meta:
        unique_together = ("date", "source")
        ordering = ["-date", "-fetched_at"]
        verbose_name = "Rates History"
        verbose_name_plural = "Rates History"

    def __str__(self):
        return f"{self.date} - {self.source} (base: {self.base_currency})"
