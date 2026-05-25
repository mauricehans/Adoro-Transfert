"""
Management command to seed default settings in the database.
Toutes les valeurs sont editables depuis l'admin par la suite.

Couvre :
  - Contacts (email, WhatsApp, template)
  - Grilles tarifaires FR <-> GA (paliers fins, conformes a l'ANNEXE 1 du CCTP)
  - Regles de frais par corridor (paliers pour FR<->GA, pourcentages pour les autres)
  - Limites min/max par devise
  - URLs des APIs de taux
"""

from django.core.management.base import BaseCommand

from tariffs.models import Settings


# --------------------------------------------------------------------------
# ANNEXE 1 - Grille EUR (France -> Gabon)
# Couvre 15,24 EUR a 761,24 EUR (paliers du CCTP).
# Au dela, on extrapole avec un plafond Adoro de 50 EUR (modifiable).
# --------------------------------------------------------------------------
EUR_TARIFFS = [
    {"min": 15.24,  "max": 45.73,  "fee": 2.29},
    {"min": 45.74,  "max": 76.24,  "fee": 3.81},
    {"min": 76.25,  "max": 106.74, "fee": 4.57},
    {"min": 106.75, "max": 137.24, "fee": 6.86},
    {"min": 137.25, "max": 167.74, "fee": 7.62},
    {"min": 167.75, "max": 198.24, "fee": 8.38},
    {"min": 198.25, "max": 227.74, "fee": 9.91},
    {"min": 227.75, "max": 257.24, "fee": 10.66},
    {"min": 257.25, "max": 286.74, "fee": 11.42},
    {"min": 286.75, "max": 316.24, "fee": 14.48},
    {"min": 316.25, "max": 345.74, "fee": 16.00},
    {"min": 345.75, "max": 375.24, "fee": 16.77},
    {"min": 375.25, "max": 404.74, "fee": 17.53},
    {"min": 404.75, "max": 434.24, "fee": 19.05},
    {"min": 434.25, "max": 463.74, "fee": 19.81},
    {"min": 463.75, "max": 493.24, "fee": 21.33},
    {"min": 493.25, "max": 522.74, "fee": 22.09},
    {"min": 522.75, "max": 552.24, "fee": 25.19},
    {"min": 552.25, "max": 581.74, "fee": 27.45},
    {"min": 581.75, "max": 611.24, "fee": 29.72},
    {"min": 611.25, "max": 640.74, "fee": 31.98},
    {"min": 640.75, "max": 670.24, "fee": 34.24},
    {"min": 670.25, "max": 699.74, "fee": 35.99},
    {"min": 699.75, "max": 761.24, "fee": 39.62},
    # Extrapolation : au dela de 761,24 EUR, plafond a 50 EUR (modifiable).
    {"min": 761.25, "max": None, "fee": 50.00},
]

# --------------------------------------------------------------------------
# ANNEXE 1 - Grille FCFA (Gabon -> France)
# Paliers de 20 000 FCFA, 10 000 -> 500 000 FCFA.
# Au dela on extrapole.
# --------------------------------------------------------------------------
FCFA_TARIFFS = [
    {"min": 10000,  "max": 30000,  "fee": 1500},
    {"min": 30001,  "max": 50000,  "fee": 2500},
    {"min": 50001,  "max": 70000,  "fee": 3000},
    {"min": 70001,  "max": 90000,  "fee": 4500},
    {"min": 90001,  "max": 110000, "fee": 5000},
    {"min": 110001, "max": 130000, "fee": 5500},
    {"min": 130001, "max": 150000, "fee": 6500},
    {"min": 150001, "max": 170000, "fee": 7000},
    {"min": 170001, "max": 190000, "fee": 7500},
    {"min": 190001, "max": 210000, "fee": 9500},
    {"min": 210001, "max": 230000, "fee": 10500},
    {"min": 230001, "max": 250000, "fee": 11000},
    {"min": 250001, "max": 270000, "fee": 11500},
    {"min": 270001, "max": 290000, "fee": 12500},
    {"min": 290001, "max": 310000, "fee": 13000},
    {"min": 310001, "max": 330000, "fee": 14000},
    {"min": 330001, "max": 350000, "fee": 14500},
    {"min": 350001, "max": 370000, "fee": 16500},
    {"min": 370001, "max": 390000, "fee": 18000},
    {"min": 390001, "max": 410000, "fee": 19500},
    {"min": 410001, "max": 430000, "fee": 21000},
    {"min": 430001, "max": 450000, "fee": 22500},
    {"min": 450001, "max": 470000, "fee": 23500},
    {"min": 470001, "max": 500000, "fee": 26000},
    # Extrapolation : au dela de 500 000, plafond a 35 000 FCFA (modifiable).
    {"min": 500001, "max": None, "fee": 35000},
]

# --------------------------------------------------------------------------
# Grille MAD : conservee a titre de fallback (non specifiee dans le CCTP).
# Pour FR <-> MA, le CCTP demande 5% donc cette grille n'est pas utilisee
# par defaut (sauf si on retire la regle "percent" pour ces corridors).
# --------------------------------------------------------------------------
MAD_TARIFFS = [
    {"min": 150,   "max": 500,   "fee": 25},
    {"min": 501,   "max": 1000,  "fee": 50},
    {"min": 1001,  "max": 2000,  "fee": 100},
    {"min": 2001,  "max": 5000,  "fee": 250},
    {"min": 5001,  "max": 7500,  "fee": 375},
    {"min": 7501,  "max": None,  "fee": 500},
]

# --------------------------------------------------------------------------
# Regles de frais par corridor (CCTP page 15)
#   FR <-> GA  : grille a paliers (ANNEXE 1)
#   GA <-> SN  : 4.5 %
#   SN <-> FR  : 5 %
#   GA <-> MA  : 4.5 %
#   MA <-> FR  : 5 %
#   SN <-> MA  : 4.5 %
#   FR <-> CM  : reutilise les paliers EUR/FCFA (corridor non specifie au CCTP)
# --------------------------------------------------------------------------
CORRIDOR_FEE_RULES = {
    # France <-> Gabon : grille a paliers detaillee
    "FR_GA": {"strategy": "tiers",   "tariff_key": "eur_tariffs"},
    "GA_FR": {"strategy": "tiers",   "tariff_key": "fcfa_tariffs"},
    # Cameroun : meme grille que Gabon (corridor non specifie au CCTP)
    "FR_CM": {"strategy": "tiers",   "tariff_key": "eur_tariffs"},
    "CM_FR": {"strategy": "tiers",   "tariff_key": "fcfa_tariffs"},
    # Pourcentages du CCTP
    "GA_SN": {"strategy": "percent", "percent": 4.5},
    "SN_GA": {"strategy": "percent", "percent": 4.5},
    "SN_FR": {"strategy": "percent", "percent": 5.0},
    "FR_SN": {"strategy": "percent", "percent": 5.0},
    "GA_MA": {"strategy": "percent", "percent": 4.5},
    "MA_GA": {"strategy": "percent", "percent": 4.5},
    "MA_FR": {"strategy": "percent", "percent": 5.0},
    "FR_MA": {"strategy": "percent", "percent": 5.0},
    "SN_MA": {"strategy": "percent", "percent": 4.5},
    "MA_SN": {"strategy": "percent", "percent": 4.5},
}

# --------------------------------------------------------------------------
# Limites min/max par devise source (CCTP FAQ q.3 + Annexe 1)
#   FCFA : 10 000 a 500 000 FCFA / transaction
#   EUR  : 15.24 a 761.24 EUR (depuis l'annexe) — minimum CCTP = 15 EUR
#   MAD  : aligne sur l'equivalent en MAD (env. 150 - 7500 MAD)
# --------------------------------------------------------------------------
AMOUNT_LIMITS = {
    "EUR": {"min": 15,    "max": 761.24},
    "XAF": {"min": 10000, "max": 500000},
    "XOF": {"min": 10000, "max": 500000},
    "MAD": {"min": 150,   "max": 10000},
    "USD": {"min": 15,    "max": 1000},
}


DEFAULT_SETTINGS = [
    {
        "key": "notification_email",
        "value": {"email": "AdoroTransfert@gmail.com"},
        "description": "Email destinataire des notifications de nouvelles transactions",
        "is_public": True,
    },
    {
        "key": "whatsapp_number",
        "value": {"number": "0769410916"},
        "description": "Numero WhatsApp pour les notifications et le contact client",
        "is_public": True,
    },
    {
        "key": "whatsapp_template",
        "value": {"template": ""},
        "description": (
            "Template WhatsApp global (optionnel). Laisser vide pour utiliser "
            "les templates specifiques par corridor cotes frontend (CCTP §2.2 à §2.7). "
            "Si renseigne, ce template ecrase les templates corridor."
        ),
        "is_public": True,
    },
    # ANNEXE : adresse et horaires (CCTP §3.5)
    {
        "key": "business_address",
        "value": {
            "city": "Libreville",
            "country": "Gabon",
            "full": "Libreville, Gabon",
        },
        "description": "Adresse affichee sur la page Contact. Editable depuis l'admin.",
        "is_public": True,
    },
    {
        "key": "business_hours",
        "value": {
            "weekdays": "08:00 - 20:00",
            "saturday": "09:00 - 17:00",
            "sunday": "Ferme",
            "timezone": "Heures de Libreville (UTC+1). WhatsApp disponible 7j/7.",
        },
        "description": "Horaires d'ouverture affiches sur la page Contact. Editable depuis l'admin.",
        "is_public": True,
    },
    {
        "key": "active_currencies",
        "value": {"currencies": ["EUR", "XAF", "XOF", "MAD", "USD"]},
        "description": "Liste des devises actives sur le simulateur",
        "is_public": True,
    },
    # Grilles tarifaires
    {
        "key": "eur_tariffs",
        "value": {"tariffs": EUR_TARIFFS},
        "description": "Grille tarifaire EUR (FR -> GA, CCTP ANNEXE 1)",
        "is_public": True,
    },
    {
        "key": "fcfa_tariffs",
        "value": {"tariffs": FCFA_TARIFFS},
        "description": "Grille tarifaire FCFA (GA -> FR, CCTP ANNEXE 1)",
        "is_public": True,
    },
    {
        "key": "mad_tariffs",
        "value": {"tariffs": MAD_TARIFFS},
        "description": "Grille tarifaire MAD (fallback, non utilisee pour MA<->FR qui est en %)",
        "is_public": True,
    },
    # Regles par corridor (pourcentages CCTP page 15)
    {
        "key": "corridor_fee_rules",
        "value": {"rules": CORRIDOR_FEE_RULES},
        "description": (
            "Strategie de frais par corridor : 'tiers' = grille a paliers, "
            "'percent' = pourcentage du montant. Editable depuis l'admin."
        ),
        "is_public": False,
    },
    # Limites min/max par devise (CCTP FAQ q.3)
    {
        "key": "amount_limits",
        "value": {"limits": AMOUNT_LIMITS},
        "description": "Montants min/max acceptes par devise source. Editable depuis l'admin.",
        "is_public": True,
    },
    {
        "key": "api_urls",
        "value": {
            "urls": [
                {"name": "exchangeratesapi.io", "url": "https://api.exchangeratesapi.io/v1/latest"},
                {"name": "frankfurter.app",     "url": "https://api.frankfurter.app/latest"},
            ]
        },
        "description": "URLs des sources API pour les taux de change",
        "is_public": False,
    },
]


class Command(BaseCommand):
    help = "Seed default settings : contacts, grilles tarifaires, regles par corridor"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Ecrase aussi les settings deja presents (par defaut on met a jour).",
        )

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
            # Pour les longues valeurs (tariffs), on tronque l'affichage.
            preview = str(obj.value)
            if len(preview) > 100:
                preview = preview[:100] + "..."
            self.stdout.write(f"  {status}: {obj.key} = {preview}")

        self.stdout.write(self.style.SUCCESS("\nDefault settings seeded successfully."))
        self.stdout.write(
            "Rappel : pour recharger les tarifs sans changer les contacts, "
            "il suffit de relancer cette commande."
        )
