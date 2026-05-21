"""
Management command to seed default contact settings in the database.
These can then be modified by the admin via the admin panel.
"""

from django.core.management.base import BaseCommand

from tariffs.models import Settings


DEFAULT_SETTINGS = [
    {
        "key": "notification_email",
        "value": {"email": "AdoroTransfert@gmail.com"},
        "description": "Email destinataire des notifications de nouvelles transactions",
        "is_public": True,
    },
    {
        "key": "whatsapp_number",
        "value": {"number": "2417449818"},
        "description": "Numero WhatsApp pour les notifications et le contact client",
        "is_public": True,
    },
    {
        "key": "whatsapp_template",
        "value": {
            "template": (
                "Bonjour, je souhaite effectuer un transfert via Adoro Transfert.\n\n"
                "--- Details de la simulation ---\n"
                "Corridor: {corridor}\n"
                "Montant envoye: {amount_sent} {currency_sent}\n"
                "Frais Adoro: {adoro_fee} {currency_sent}\n"
                "Total a envoyer: {total_to_send} {currency_sent}\n"
                "Beneficiaire recoit: {amount_received} {currency_received}\n"
                "Taux applique: {rate}\n\n"
                "--- Beneficiaire ---\n"
                "Nom: {beneficiary_name}\n"
                "Telephone: {beneficiary_phone}\n"
            )
        },
        "description": "Template du message WhatsApp pre-rempli envoye par le client",
        "is_public": True,
    },
    {
        "key": "active_currencies",
        "value": {"currencies": ["EUR", "XAF", "XOF", "MAD", "USD"]},
        "description": "Liste des devises actives sur le simulateur",
        "is_public": True,
    },
]


class Command(BaseCommand):
    help = "Seed default contact settings (email, WhatsApp number) in the database"

    def handle(self, *args, **options):
        for setting_data in DEFAULT_SETTINGS:
            obj, created = Settings.objects.update_or_create(
                key=setting_data["key"],
                defaults={
                    "value": setting_data["value"],
                    "description": setting_data["description"],
                    "is_public": setting_data["is_public"],
                },
            )
            status = "Created" if created else "Updated"
            self.stdout.write(f"  {status}: {obj.key} = {obj.value}")

        self.stdout.write(self.style.SUCCESS("\nDefault settings seeded successfully."))
