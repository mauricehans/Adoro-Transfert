"""
Celery tasks for fetching exchange rates.

Strategy a trois niveaux :
  1. Primaire   : exchangeratesapi.io (cle API requise, base EUR sur le plan free)
  2. Secondaire : frankfurter.app    (gratuit, sans cle, BCE — pas de XAF/XOF, on patche)
  3. Fallback   : parite fixe XAF/XOF (1 EUR = 655.957 FCFA) + valeurs par defaut

La cle API doit etre fournie via la variable d'environnement EXCHANGE_API_KEY.
Si elle est absente, on passe directement au secondaire.
"""

import logging
from datetime import date, timedelta

import requests
from celery import shared_task
from decouple import config

from .models import RatesHistory

logger = logging.getLogger(__name__)

# Parite fixe institutionnelle de la zone franc CFA (BCEAO / BEAC).
# Ne varie pas — fixee par accord avec le Tresor francais.
STATIC_FCFA_RATE = 655.957

# Valeurs de secours si les deux API tombent (a rafraichir manuellement
# si elles deviennent trop obsoletes).
STATIC_FALLBACK_RATES = {
    "XAF": STATIC_FCFA_RATE,
    "XOF": STATIC_FCFA_RATE,
    "MAD": 10.90,
    "USD": 1.09,
    "GBP": 0.86,
}

# Devises dont le simulateur a besoin (base EUR).
REQUIRED_SYMBOLS = ["XAF", "XOF", "MAD", "USD", "GBP"]

REQUEST_TIMEOUT = 8

# URL de base ExchangeRatesAPI.io (HTTPS supporte sur tous les plans).
EXCHANGERATESAPI_URL = "https://api.exchangeratesapi.io/v1/latest"
FRANKFURTER_URL = "https://api.frankfurter.app/latest"


def _normalize_rates(raw_rates: dict) -> dict:
    """Retourne un dict propre {CCY: float} en ne gardant que les symboles connus."""
    out = {}
    for ccy in REQUIRED_SYMBOLS:
        if ccy in raw_rates:
            try:
                out[ccy] = float(raw_rates[ccy])
            except (TypeError, ValueError):
                logger.warning("Bad rate value for %s: %r", ccy, raw_rates[ccy])
    return out


def _patch_fcfa(rates: dict) -> dict:
    """
    Applique la parite fixe FCFA. On ne fait jamais confiance a la valeur
    d'API pour XAF/XOF parce qu'elle est generalement derivee et bruitee
    alors que la parite est legalement fixe.
    """
    rates["XAF"] = STATIC_FCFA_RATE
    rates["XOF"] = STATIC_FCFA_RATE
    return rates


def _try_exchangeratesapi(target_date: date = None) -> dict | None:
    """
    Source primaire : exchangeratesapi.io
    GET https://api.exchangeratesapi.io/v1/YYYY-MM-DD?access_key=KEY&base=EUR&symbols=...

    Sur le plan free, la `base` est forcement EUR — on l'envoie quand meme
    pour etre explicite, et on remappe les devises si besoin.
    """
    api_key = config("EXCHANGE_API_KEY", default="")
    if not api_key:
        logger.warning(
            "EXCHANGE_API_KEY missing — skipping exchangeratesapi.io and "
            "falling back to frankfurter.app."
        )
        return None

    url = f"https://api.exchangeratesapi.io/v1/{target_date.strftime('%Y-%m-%d')}" if target_date else EXCHANGERATESAPI_URL

    try:
        resp = requests.get(
            url,
            params={
                "access_key": api_key,
                "base": "EUR",
                "symbols": ",".join(REQUIRED_SYMBOLS),
            },
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()

        if not data.get("success", False):
            err = data.get("error") or {}
            logger.warning(
                "exchangeratesapi.io error code=%s type=%s info=%s",
                err.get("code"),
                err.get("type"),
                err.get("info"),
            )
            return None

        raw = data.get("rates") or {}
        rates = _normalize_rates(raw)

        # Au minimum on attend USD ou MAD ; XAF/XOF seront patches.
        if not rates:
            logger.warning("exchangeratesapi.io returned no usable rates: %s", data)
            return None

        rates = _patch_fcfa(rates)
        return {
            "source": RatesHistory.Source.EXCHANGERATES_API,
            "rates": rates,
        }
    except requests.RequestException as e:
        logger.warning("exchangeratesapi.io request failed: %s", e)
    except (ValueError, KeyError) as e:
        logger.warning("exchangeratesapi.io bad response: %s", e)
    return None


def _try_frankfurter(target_date: date = None) -> dict | None:
    """
    Source secondaire : frankfurter.app (donnees BCE, sans cle).
    GET https://api.frankfurter.app/YYYY-MM-DD?from=EUR&to=USD,MAD,GBP
    Ne supporte pas XAF/XOF : on les patche avec la parite fixe.
    """
    url = f"https://api.frankfurter.app/{target_date.strftime('%Y-%m-%d')}" if target_date else FRANKFURTER_URL
    try:
        resp = requests.get(
            url,
            params={"from": "EUR", "to": "USD,MAD,GBP"},
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        raw = data.get("rates") or {}
        rates = _normalize_rates(raw)
        if not rates:
            logger.warning("frankfurter.app returned no rates: %s", data)
            return None
        rates = _patch_fcfa(rates)
        return {
            "source": RatesHistory.Source.FRANKFURTER,
            "rates": rates,
        }
    except requests.RequestException as e:
        logger.warning("frankfurter.app request failed: %s", e)
    except (ValueError, KeyError) as e:
        logger.warning("frankfurter.app bad response: %s", e)
    return None


def _static_rates() -> dict:
    """Dernier recours : valeurs en dur."""
    logger.error("Both rate APIs failed — falling back to static rates.")
    return {
        "source": RatesHistory.Source.STATIC,
        "rates": dict(STATIC_FALLBACK_RATES),
    }


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def fetch_daily_rates(self, target_date_str=None):
    """
    Recupere les taux du jour.
    Ordre : exchangeratesapi.io -> frankfurter.app -> static.
    Sauvegarde dans RatesHistory et nettoie les entrees > 30 jours.
    """
    if target_date_str:
        today = date.fromisoformat(target_date_str)
    else:
        today = date.today()

    result = _try_exchangeratesapi(today)
    if result is None:
        result = _try_frankfurter(today)
    if result is None:
        result = _static_rates()

    rates_entry, created = RatesHistory.objects.update_or_create(
        date=today,
        defaults={
            "source": result["source"],
            "base_currency": "EUR",
            "rates": result["rates"],
        },
    )

    logger.info(
        "Rates %s for %s from %s: %s",
        "created" if created else "updated",
        today,
        result["source"],
        result["rates"],
    )

    # Nettoyage : on garde 30 jours d'historique.
    thirty_days_ago = today - timedelta(days=30)
    deleted_count, _ = RatesHistory.objects.filter(date__lt=thirty_days_ago).delete()
    if deleted_count > 0:
        logger.info("Deleted %s old rate entries (older than 30 days).", deleted_count)

    return {
        "date": str(today),
        "source": result["source"],
        "rates": result["rates"],
    }
