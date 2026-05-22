import uuid

from django.db import models


class Transaction(models.Model):
    """A simulated money transfer request."""

    class Status(models.TextChoices):
        PENDING_CONTACT = "pending_contact", "En attente de contact"
        IN_PROGRESS = "in_progress", "En cours"
        COMPLETED = "completed", "Terminee"
        CANCELLED = "cancelled", "Annulee"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    corridor = models.CharField(max_length=10)

    # Amounts
    amount_sent = models.DecimalField(max_digits=12, decimal_places=2)
    currency_sent = models.CharField(max_length=3, default="EUR")
    amount_received = models.DecimalField(max_digits=14, decimal_places=2)
    currency_received = models.CharField(max_length=3, default="XAF")
    fees_adoro = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fees_airtel = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_to_send = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    rate_used = models.DecimalField(max_digits=12, decimal_places=6, default=0)

    # Beneficiary info
    beneficiary_name = models.CharField(max_length=200)
    beneficiary_phone = models.CharField(max_length=30, blank=True)
    beneficiary_email = models.EmailField(blank=True)

    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING_CONTACT,
    )
    admin_notes = models.TextField(blank=True)
    email_sent = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"

    def __str__(self):
        return f"#{str(self.id)[:8]} — {self.amount_sent} {self.currency_sent} → {self.amount_received} {self.currency_received}"
