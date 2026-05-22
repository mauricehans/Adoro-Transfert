"""
Celery tasks for fetching exchange rates.

Two-tier strategy:
  ① Primary   : exchangerate.host  (free, supports XAF/XOF/MAD/USD)
  ② Secondary : frankfurter.app    (free, BCE-backed, USD/MAD only -> we patch XAF/XOF/MAD)
  ③ Fallback  : hard-coded XAF/XOF parity (1 EUR = 655.957 FCFA, fixed) + sane defaults
"""

import logging
from datetime import date, timedelta
from decimal import Decimal

import requests
from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import RatesHistory

logger = logging.getLogger(__name__)

# Fixed CFA Franc zone parity (institutional, never changes)
STATIC_FCFA_RATE = 655.957

# Sane defaults if BOTH APIs are down (refreshed roughly twice a year)
STATIC_FALLBACK_RATES = {
    "XAF": STATIC_FCFA_RATE,
    "XOF": STATIC_FCFA_RATE,
    "MAD": 10.90,
    "USD": 1.09,
    "GBP": 0.86,
}

# Currencies the simulator actually needs
REQUIRED_SYMBOLS = ["XAF", "XOF", "MAD", "USD", "GBP"]

REQUEST_TIMEOUT = 8


def _normalize_rates(raw_rates: dict) -> dict:
    """Return a clean dict {CCY: float} keeping only known symbols."""
    out = {}
    for ccy in REQUIRED_SYMBOLS:
        if ccy in raw_rates:
            try:
                out[ccy] = float(raw_rates[ccy])
            except (TypeError, ValueError):
                logger.warning(f"Bad rate value for {ccy}: {raw_rates[ccy]!r}")
    return out


def _try_exchangeratesapi() -> dict | None:
    """
    Primary source: exchangeratesapi.io
    Endpoint: http://api.exchangeratesapi.io/v1/latest?access_key=...&base=EUR&symbols=...
    """
    try:
        resp = requests.get(
            "http://api.exchangeratesapi.io/v1/latest",
            params={
                "access_key": "fb2ecc203324df1d2f7926b715dc2b0f",
                "base": "EUR",
                "symbols": ",".join(REQUIRED_SYMBOLS)
            },
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        
        if not data.get("success"):
            logger.warning(f"exchangeratesapi.io returned failure: {data}")
            return None
            
        raw = data.get("rates") or {}
        rates = _normalize_rates(raw)
        
        # We need at least the FCFA pair for the simulator to be useful.
        if not rates or "XAF" not in rates:
            logger.warning(f"exchangeratesapi.io returned unusable payload: {data}")
            return None
            
        # If FCFA is missing or out of sane bounds, patch with fixed parity
        if "XAF" not in rates or not (600 < rates["XAF"] < 700):
            rates["XAF"] = STATIC_FCFA_RATE
        if "XOF" not in rates or not (600 < rates["XOF"] < 700):
            rates["XOF"] = STATIC_FCFA_RATE
            
        return {
            "source": "exchangeratesapi.io",
            "rates": rates,
        }
    except requests.RequestException as e:
        logger.warning(f"exchangeratesapi.io request failed: {e}")
    except (ValueError, KeyError) as e:
        logger.warning(f"exchangeratesapi.io bad response: {e}")
    return None


def _try_frankfurter() -> dict | None:
    """
    Secondary source: frankfurter.app (BCE).
    Endpoint: https://api.frankfurter.app/latest?from=EUR&to=USD,MAD,GBP
    Does NOT support XAF/XOF — we patch them with the fixed FCFA parity.
    """
    try:
        # Frankfurter supports USD, MAD, GBP but not XAF/XOF
        resp = requests.get(
            "https://api.frankfurter.app/latest",
            params={"from": "EUR", "to": "USD,MAD,GBP"},
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        raw = data.get("rates") or {}
        rates = _normalize_rates(raw)
        if not rates:
            logger.warning(f"frankfurter.app returned no rates: {data}")
            return None
        # Patch CFA Franc with fixed parity (zone franc CFA)
        rates["XAF"] = STATIC_FCFA_RATE
        rates["XOF"] = STATIC_FCFA_RATE
        return {
            "source": RatesHistory.Source.FRANKFURTER,
            "rates": rates,
        }
    except requests.RequestException as e:
        logger.warning(f"frankfurter.app request failed: {e}")
    except (ValueError, KeyError) as e:
        logger.warning(f"frankfurter.app bad response: {e}")
    return None


def _static_rates() -> dict:
    """Last resort: hard-coded sane defaults."""
    logger.error("Both rate APIs failed — falling back to static rates.")
    return {
        "source": RatesHistory.Source.STATIC,
        "rates": dict(STATIC_FALLBACK_RATES),
    }


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def fetch_daily_rates(self):
    """
    Fetch daily exchange rates.
    Order: exchangeratesapi.io → frankfurter.app → static.
    Saves to RatesHistory and broadcasts via Channels.
    """
    today = date.today()

    result = _try_exchangeratesapi()
    if result is None:
        result = _try_frankfurter()
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
        f"Rates {'created' if created else 'updated'} for {today} "
        f"from {result['source']}: {result['rates']}"
    )

    # Delete rates older than 30 days
    thirty_days_ago = today - timedelta(days=30)
    deleted_count, _ = RatesHistory.objects.filter(date__lt=thirty_days_ago).delete()
    if deleted_count > 0:
        logger.info(f"Deleted {deleted_count} old rate entries (older than 30 days).")

    return {
        "date": str(today),
        "source": result["source"],
        "rates": result["rates"],
    }
