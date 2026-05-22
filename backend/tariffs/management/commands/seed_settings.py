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
    {
        "key": "fcfa_tariffs",
        "value": {"tariffs": [
            {"min": 1000, "max": 50000, "fee": 1000},
            {"min": 50001, "max": 100000, "fee": 2000},
            {"min": 100001, "max": 200000, "fee": 3000},
            {"min": 200001, "max": 350000, "fee": 4500},
            {"min": 350001, "max": 500000, "fee": 6000},
            {"min": 500001, "max": 750000, "fee": 8000},
            {"min": 750001, "max": 1000000, "fee": 10000},
            {"min": 1000001, "max": None, "fee": 12000},
        ]},
        "description": "Grille tarifaire pour les envois en FCFA",
        "is_public": True,
    },
    {
        "key": "eur_tariffs",
        "value": {"tariffs": [
            {"min": 1, "max": 50, "fee": 3},
            {"min": 51, "max": 100, "fee": 5},
            {"min": 101, "max": 200, "fee": 8},
            {"min": 201, "max": 350, "fee": 10},
            {"min": 351, "max": 500, "fee": 12},
            {"min": 501, "max": 750, "fee": 15},
            {"min": 751, "max": 1000, "fee": 18},
            {"min": 1001, "max": None, "fee": 22},
        ]},
        "description": "Grille tarifaire pour les envois en EUR",
        "is_public": True,
    },
    {
        "key": "mad_tariffs",
        "value": {"tariffs": [
            {"min": 10, "max": 500, "fee": 10},
            {"min": 501, "max": 1000, "fee": 20},
            {"min": 1001, "max": 2000, "fee": 35},
            {"min": 2001, "max": 5000, "fee": 50},
            {"min": 5001, "max": 10000, "fee": 80},
            {"min": 10001, "max": None, "fee": 120},
        ]},
        "description": "Grille tarifaire pour les envois en MAD (Maroc)",
        "is_public": True,
    },
    {
        "key": "api_urls",
        "value": {"urls": [
            {"name": "ECB", "url": "https://api.exchangeratesapi.io/v1/latest"},
            {"name": "XE", "url": "https://xecdapi.xe.com/v1/convert_from"},
        ]},
        "description": "URLs des sources API pour les taux de change",
        "is_public": False,
    }
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
