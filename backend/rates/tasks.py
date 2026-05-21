"""
Celery tasks for fetching exchange rates.
"""

import logging
from datetime import date

import requests
from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import RatesHistory

logger = logging.getLogger(__name__)

# Fixed FCFA parity (CFA Franc zone pegged to EUR)
STATIC_FCFA_RATE = 655.957


def _try_exchangerate_host() -> dict | None:
    """Try fetching rates from exchangerate.host (primary source)."""
    try:
        resp = requests.get(
            "https://api.exchangerate.host/latest",
            params={"base": "EUR", "symbols": "XAF,XOF,USD,GBP"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        if data.get("success") and data.get("rates"):
            return {
                "source": RatesHistory.Source.EXCHANGERATE_HOST,
                "rates": data["rates"],
            }
    except Exception as e:
        logger.warning(f"exchangerate.host failed: {e}")
    return None


def _try_frankfurter() -> dict | None:
    """Try fetching rates from frankfurter.dev (fallback)."""
    try:
        resp = requests.get(
            "https://api.frankfurter.dev/v1/latest",
            params={"base": "EUR", "symbols": "USD,GBP"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        if data.get("rates"):
            # Frankfurter doesn't have XAF/XOF, add them as static
            rates = data["rates"]
            rates["XAF"] = STATIC_FCFA_RATE
            rates["XOF"] = STATIC_FCFA_RATE
            return {
                "source": RatesHistory.Source.FRANKFURTER,
                "rates": rates,
            }
    except Exception as e:
        logger.warning(f"frankfurter.dev failed: {e}")
    return None


def _static_rates() -> dict:
    """Return static FCFA rates as last resort."""
    return {
        "source": RatesHistory.Source.STATIC,
        "rates": {
            "XAF": STATIC_FCFA_RATE,
            "XOF": STATIC_FCFA_RATE,
            "USD": 1.08,
            "GBP": 0.86,
        },
    }


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def fetch_daily_rates(self):
    """
    Fetch daily exchange rates.
    Tries exchangerate.host first, falls back to frankfurter.dev,
    then uses static FCFA rate (655.957).
    Saves to RatesHistory and broadcasts via Channels.
    """
    today = date.today()

    # Try sources in order
    result = _try_exchangerate_host()
    if result is None:
        result = _try_frankfurter()
    if result is None:
        result = _static_rates()

    # Save to database (update if already exists for today + source)
    rates_entry, created = RatesHistory.objects.update_or_create(
        date=today,
        source=result["source"],
        defaults={
            "base_currency": "EUR",
            "rates": result["rates"],
        },
    )

    logger.info(
        f"Rates {'created' if created else 'updated'} for {today} "
        f"from {result['source']}: {result['rates']}"
    )

    # Broadcast via Channels to all connected WebSocket clients
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "rates_global",
        {
            "type": "rates.update",
            "payload": {
                "date": str(today),
                "source": result["source"],
                "rates": result["rates"],
            },
        },
    )

    return {
        "date": str(today),
        "source": result["source"],
        "rates": result["rates"],
    }
