import uuid

from django.db import models


class Transaction(models.Model):
    """A simulated money transfer request."""

    class Status(models.TextChoices):
        PENDING_CONTACT = "pending_contact", "En attente de contact"
        IN_PROGRESS = "in_progress", "En cours"
        COMPLETED = "completed", "Terminee"
        CANCELLED = "cancelled", "Annulee"

    class Corridor(models.TextChoices):
        EUR_XAF = "EUR_XAF", "EUR -> XAF (FCFA CEMAC)"
        EUR_XOF = "EUR_XOF", "EUR -> XOF (FCFA UEMOA)"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    corridor = models.CharField(max_length=10, choices=Corridor.choices)

    # Amounts
    amount_sent = models.DecimalField(max_digits=12, decimal_places=2, help_text="Amount in EUR")
    amount_received = models.DecimalField(max_digits=14, decimal_places=2, help_text="Amount in target currency")
    fees = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rate_applied = models.DecimalField(max_digits=12, decimal_places=6)
    include_airtel = models.BooleanField(default=False)

    # Beneficiary info
    sender_name = models.CharField(max_length=200)
    sender_phone = models.CharField(max_length=20)
    sender_email = models.EmailField(blank=True)
    beneficiary_name = models.CharField(max_length=200)
    beneficiary_phone = models.CharField(max_length=20)
    beneficiary_city = models.CharField(max_length=100, blank=True)

    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING_CONTACT,
    )
    admin_notes = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"

    def __str__(self):
        return f"#{str(self.id)[:8]} - {self.amount_sent}EUR -> {self.corridor}"
