"""
Transfer simulation calculator.
Computes fees, applies exchange rate, returns breakdown.
Rate is fetched from the database (RatesHistory), with a static fallback.
"""

from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from tariffs.models import Settings


# Hard fallback when no rate is available in BDD.
# XAF/XOF are pegged to EUR (1 EUR = 655.957 FCFA, fixed).
STATIC_RATES = {
    "XAF": Decimal("655.957"),
    "XOF": Decimal("655.957"),
    "MAD": Decimal("10.90"),
    "USD": Decimal("1.09"),
}

CORRIDOR_CURRENCY_MAP = {
    "FR_GA": "XAF",
    "GA_FR": "XAF",
    "FR_CM": "XAF",
    "CM_FR": "XAF",
    "FR_SN": "XOF",
    "SN_FR": "XOF",
    "FR_MA": "MAD",
    "MA_FR": "MAD",
}

# Corridors where Airtel Money withdrawal fee applies
AIRTEL_CORRIDORS = {"FR_GA", "GA_FR", "FR_CM", "CM_FR", "FR_SN", "SN_FR"}

# Mapping: which tariff key to use for non-EUR source corridors
NON_EUR_TARIFF_KEY = {
    "GA_FR": "fcfa_tariffs",
    "CM_FR": "fcfa_tariffs",
    "SN_FR": "fcfa_tariffs",
    "MA_FR": "mad_tariffs",
}


def get_tariffs(key):
    try:
        return Settings.objects.get(key=key).value.get("tariffs", [])
    except Settings.DoesNotExist:
        return []


def get_rate_for_corridor(corridor: str) -> Decimal:
    """
    Get the latest exchange rate for a corridor from the database.
    Falls back to static rates if no data in BDD.
    """
    from rates.models import RatesHistory

    target_currency = CORRIDOR_CURRENCY_MAP.get(corridor, "XAF")

    latest = RatesHistory.objects.first()
    if latest and latest.rates:
        db_rate = latest.rates.get(target_currency)
        if db_rate is not None:
            return Decimal(str(db_rate))

    return STATIC_RATES.get(target_currency, Decimal("655.957"))


def recalculate(state: dict) -> dict:
    """
    Recalculate a transfer simulation based on the current state.
    Rate is fetched from the database automatically based on the corridor.
    Inputs are validated/coerced defensively (consumer is WS-facing).
    """
    corridor = state.get("corridor", "FR_GA")
    if corridor not in CORRIDOR_CURRENCY_MAP:
        corridor = "FR_GA"

    try:
        amount = Decimal(str(state.get("amount", 0)))
    except (InvalidOperation, TypeError, ValueError):
        amount = Decimal("0")

    if amount < 0:
        amount = Decimal("0")
    if amount > Decimal("10000000"):
        amount = Decimal("10000000")

    include_airtel = bool(
        state.get("include_airtel_fee", state.get("includeAirtel", False))
    )

    # Airtel only applies to Africa corridors, not Morocco
    if corridor not in AIRTEL_CORRIDORS:
        include_airtel = False

    # Rate from BDD (ignore any client-sent rate)
    rate = get_rate_for_corridor(corridor)

    is_eur_source = corridor.startswith("FR_")
    target_currency = CORRIDOR_CURRENCY_MAP.get(corridor, "XAF")
    currency_sent = "EUR" if is_eur_source else target_currency
    currency_received = target_currency if is_eur_source else "EUR"

    if amount <= 0:
        return {
            "corridor": corridor,
            "amount_sent": Decimal("0"),
            "currency_sent": currency_sent,
            "adoro_fee": Decimal("0"),
            "airtel_fee": Decimal("0"),
            "total_to_send": Decimal("0"),
            "amount_received": Decimal("0"),
            "currency_received": currency_received,
            "rate": rate,
        }

    if is_eur_source:
        tariffs = get_tariffs("eur_tariffs")
    else:
        tariff_key = NON_EUR_TARIFF_KEY.get(corridor, "fcfa_tariffs")
        tariffs = get_tariffs(tariff_key)

    adoro_fee = Decimal("0")
    for t in tariffs:
        min_amt = Decimal(str(t.get("min", 0)))
        max_amt = t.get("max")
        if max_amt is not None:
            max_amt = Decimal(str(max_amt))

        if amount >= min_amt and (max_amt is None or amount <= max_amt):
            adoro_fee = Decimal(str(t.get("fee", 0)))
            break

    if is_eur_source:
        amount_received = (amount * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    else:
        amount_received = (amount / rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) if rate > 0 else Decimal("0")

    airtel_fee_target = Decimal("0")
    airtel_fee_source = Decimal("0")

    if include_airtel:
        xaf_amount = amount_received if is_eur_source else amount
        calculated_fee = (xaf_amount * Decimal("0.03")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        airtel_fee_xaf = min(calculated_fee, Decimal("5000"))

        if is_eur_source:
            airtel_fee_target = airtel_fee_xaf
            airtel_fee_source = (airtel_fee_xaf / rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) if rate > 0 else Decimal("0")
        else:
            airtel_fee_source = airtel_fee_xaf
            airtel_fee_target = (airtel_fee_xaf / rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) if rate > 0 else Decimal("0")

    total_to_send = amount + adoro_fee + airtel_fee_source

    return {
        "corridor": corridor,
        "amount_sent": amount,
        "currency_sent": currency_sent,
        "adoro_fee": adoro_fee,
        "airtel_fee": airtel_fee_target,
        "total_to_send": total_to_send,
        "amount_received": amount_received,
        "currency_received": currency_received,
        "rate": rate,
    }
