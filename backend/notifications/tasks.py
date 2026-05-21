"""
Celery tasks for sending notifications (email + WhatsApp).
"""

import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_notification_email(self, transaction_id: str):
    """
    Send email notification to admin about a new transaction.
    Format: "[Adoro] Nouvelle demande #ID - {amount}EUR {corridor}"
    """
    from simulator.models import Transaction
    from notifications.models import AdminAudit

    try:
        transaction = Transaction.objects.get(id=transaction_id)
    except Transaction.DoesNotExist:
        logger.error(f"Transaction {transaction_id} not found for notification.")
        return

    short_id = str(transaction.id)[:8]
    subject = (
        f"[Adoro] Nouvelle demande #{short_id} "
        f"- {transaction.amount_sent}€ {transaction.get_corridor_display()}"
    )

    # Render HTML email template
    html_message = render_to_string(
        "notifications/new_transaction.html",
        {
            "transaction": transaction,
            "short_id": short_id,
        },
    )

    # Plain text fallback
    plain_message = (
        f"Nouvelle demande de transfert #{short_id}\n\n"
        f"Corridor: {transaction.get_corridor_display()}\n"
        f"Montant: {transaction.amount_sent} EUR\n"
        f"Montant recu: {transaction.amount_received} {transaction.corridor.split('_')[1]}\n"
        f"Frais: {transaction.fees} EUR\n"
        f"Taux: {transaction.rate_applied}\n\n"
        f"Expediteur: {transaction.sender_name} ({transaction.sender_phone})\n"
        f"Beneficiaire: {transaction.beneficiary_name} ({transaction.beneficiary_phone})\n"
        f"Ville: {transaction.beneficiary_city}\n\n"
        f"Statut: {transaction.get_status_display()}\n"
    )

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.ADMIN_NOTIFICATION_EMAIL],
            fail_silently=False,
        )
        logger.info(f"Email notification sent for transaction #{short_id}")

        # Log the audit
        AdminAudit.objects.create(
            action=AdminAudit.Action.EMAIL_SENT,
            target=str(transaction.id),
            payload={
                "subject": subject,
                "recipient": settings.ADMIN_NOTIFICATION_EMAIL,
            },
        )

    except Exception as exc:
        logger.error(f"Failed to send email for transaction #{short_id}: {exc}")
        raise self.retry(exc=exc)

    # Also send WhatsApp notification
    send_whatsapp_notification.delay(transaction_id)


@shared_task(bind=True, max_retries=2, default_retry_delay=60)
def send_whatsapp_notification(self, transaction_id: str):
    """
    Send WhatsApp notification to admin about a new transaction.
    Uses Twilio WhatsApp API.
    """
    from simulator.models import Transaction
    from notifications.models import AdminAudit

    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        logger.info("WhatsApp notifications not configured (no Twilio credentials).")
        return

    try:
        transaction = Transaction.objects.get(id=transaction_id)
    except Transaction.DoesNotExist:
        logger.error(f"Transaction {transaction_id} not found for WhatsApp notification.")
        return

    short_id = str(transaction.id)[:8]
    message_body = (
        f"*[Adoro Transfert]* Nouvelle demande #{short_id}\n\n"
        f"Montant: {transaction.amount_sent} EUR -> "
        f"{transaction.amount_received} {transaction.corridor.split('_')[1]}\n"
        f"Expediteur: {transaction.sender_name}\n"
        f"Beneficiaire: {transaction.beneficiary_name}\n"
        f"Tel: {transaction.beneficiary_phone}\n"
    )

    try:
        import requests

        url = (
            f"https://api.twilio.com/2010-04-01/Accounts/"
            f"{settings.TWILIO_ACCOUNT_SID}/Messages.json"
        )
        data = {
            "From": settings.TWILIO_WHATSAPP_FROM,
            "To": settings.ADMIN_WHATSAPP_TO,
            "Body": message_body,
        }
        resp = requests.post(
            url,
            data=data,
            auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
            timeout=15,
        )
        resp.raise_for_status()

        logger.info(f"WhatsApp notification sent for transaction #{short_id}")

        AdminAudit.objects.create(
            action=AdminAudit.Action.WHATSAPP_SENT,
            target=str(transaction.id),
            payload={
                "recipient": settings.ADMIN_WHATSAPP_TO,
                "message_sid": resp.json().get("sid", ""),
            },
        )

    except Exception as exc:
        logger.error(f"Failed to send WhatsApp for transaction #{short_id}: {exc}")
        raise self.retry(exc=exc)
