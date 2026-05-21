"""
Celery tasks for sending notifications (email + WhatsApp).
Email and WhatsApp number are read from the Settings table (BDD),
allowing the admin to modify them at any time via the admin panel.
"""

import logging

from celery import shared_task
from django.conf import settings as django_settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def get_contact_settings():
    """
    Retrieve notification email and WhatsApp number from the database.
    Falls back to django settings if not found in BDD.
    """
    from tariffs.models import Settings

    email = django_settings.ADMIN_NOTIFICATION_EMAIL
    whatsapp = django_settings.ADMIN_WHATSAPP_TO

    try:
        email_setting = Settings.objects.get(key="notification_email")
        email = email_setting.value.get("email", email)
    except Settings.DoesNotExist:
        pass

    try:
        whatsapp_setting = Settings.objects.get(key="whatsapp_number")
        whatsapp = whatsapp_setting.value.get("number", whatsapp)
    except Settings.DoesNotExist:
        pass

    return {"email": email, "whatsapp": whatsapp}


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_notification_email(self, transaction_id: str):
    """
    Send email notification to admin about a new transaction.
    Recipient email is read from BDD (Settings table, key="notification_email").
    """
    from simulator.models import Transaction
    from notifications.models import AdminAudit

    try:
        transaction = Transaction.objects.get(id=transaction_id)
    except Transaction.DoesNotExist:
        logger.error(f"Transaction {transaction_id} not found for notification.")
        return

    contact = get_contact_settings()
    recipient_email = contact["email"]

    short_id = str(transaction.id)[:8]
    subject = (
        f"[Adoro] Nouvelle demande #{short_id} "
        f"- {transaction.amount_sent}EUR {transaction.corridor}"
    )

    html_message = render_to_string(
        "notifications/new_transaction.html",
        {
            "transaction": transaction,
            "short_id": short_id,
        },
    )

    plain_message = (
        f"Nouvelle demande de transfert #{short_id}\n\n"
        f"Corridor: {transaction.corridor}\n"
        f"Montant envoye: {transaction.amount_sent} {transaction.currency_sent}\n"
        f"Montant recu: {transaction.amount_received} {transaction.currency_received}\n"
        f"Frais Adoro: {transaction.fees_adoro}\n"
        f"Frais Airtel: {transaction.fees_airtel}\n"
        f"Taux: {transaction.rate_used}\n\n"
        f"Beneficiaire: {transaction.beneficiary_name}\n"
        f"Tel: {transaction.beneficiary_phone}\n"
        f"Email: {transaction.beneficiary_email}\n\n"
        f"Statut: {transaction.status}\n"
    )

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            html_message=html_message,
            from_email=django_settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            fail_silently=False,
        )
        logger.info(f"Email notification sent for transaction #{short_id} to {recipient_email}")

        AdminAudit.objects.create(
            action=AdminAudit.Action.EMAIL_SENT,
            target=str(transaction.id),
            payload={
                "subject": subject,
                "recipient": recipient_email,
            },
        )

    except Exception as exc:
        logger.error(f"Failed to send email for transaction #{short_id}: {exc}")
        raise self.retry(exc=exc)

    send_whatsapp_notification.delay(transaction_id)


@shared_task(bind=True, max_retries=2, default_retry_delay=60)
def send_whatsapp_notification(self, transaction_id: str):
    """
    Send WhatsApp notification to admin about a new transaction.
    WhatsApp number is read from BDD (Settings table, key="whatsapp_number").
    """
    from simulator.models import Transaction
    from notifications.models import AdminAudit

    if not django_settings.TWILIO_ACCOUNT_SID or not django_settings.TWILIO_AUTH_TOKEN:
        logger.info("WhatsApp notifications not configured (no Twilio credentials).")
        return

    try:
        transaction = Transaction.objects.get(id=transaction_id)
    except Transaction.DoesNotExist:
        logger.error(f"Transaction {transaction_id} not found for WhatsApp notification.")
        return

    contact = get_contact_settings()
    whatsapp_to = contact["whatsapp"]

    short_id = str(transaction.id)[:8]
    message_body = (
        f"*[Adoro Transfert]* Nouvelle demande #{short_id}\n\n"
        f"Montant: {transaction.amount_sent} {transaction.currency_sent} -> "
        f"{transaction.amount_received} {transaction.currency_received}\n"
        f"Beneficiaire: {transaction.beneficiary_name}\n"
        f"Tel: {transaction.beneficiary_phone}\n"
    )

    try:
        import requests

        url = (
            f"https://api.twilio.com/2010-04-01/Accounts/"
            f"{django_settings.TWILIO_ACCOUNT_SID}/Messages.json"
        )
        data = {
            "From": django_settings.TWILIO_WHATSAPP_FROM,
            "To": f"whatsapp:+{whatsapp_to}",
            "Body": message_body,
        }
        resp = requests.post(
            url,
            data=data,
            auth=(django_settings.TWILIO_ACCOUNT_SID, django_settings.TWILIO_AUTH_TOKEN),
            timeout=15,
        )
        resp.raise_for_status()

        logger.info(f"WhatsApp notification sent for transaction #{short_id} to {whatsapp_to}")

        AdminAudit.objects.create(
            action=AdminAudit.Action.WHATSAPP_SENT,
            target=str(transaction.id),
            payload={
                "recipient": whatsapp_to,
                "message_sid": resp.json().get("sid", ""),
            },
        )

    except Exception as exc:
        logger.error(f"Failed to send WhatsApp for transaction #{short_id}: {exc}")
        raise self.retry(exc=exc)
