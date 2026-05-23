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

CORRIDOR_CURRENCIES = {
    "FR_GA": {"src": "EUR", "tgt": "XAF"},
    "GA_FR": {"src": "XAF", "tgt": "EUR"},
    "FR_CM": {"src": "EUR", "tgt": "XAF"},
    "CM_FR": {"src": "XAF", "tgt": "EUR"},
    "FR_SN": {"src": "EUR", "tgt": "XOF"},
    "SN_FR": {"src": "XOF", "tgt": "EUR"},
    "FR_MA": {"src": "EUR", "tgt": "MAD"},
    "MA_FR": {"src": "MAD", "tgt": "EUR"},
    "SN_GA": {"src": "XOF", "tgt": "XAF"},
    "GA_SN": {"src": "XAF", "tgt": "XOF"},
    "MA_GA": {"src": "MAD", "tgt": "XAF"},
    "GA_MA": {"src": "XAF", "tgt": "MAD"},
    "SN_MA": {"src": "XOF", "tgt": "MAD"},
    "MA_SN": {"src": "MAD", "tgt": "XOF"},
}

# Corridors where Airtel Money withdrawal fee applies
# Uniquement quand la destination est le Gabon (Airtel n'est pertinent que pour le retrait d'argent au Gabon)
AIRTEL_CORRIDORS = {"FR_GA", "SN_GA", "MA_GA"}

# Mapping: which tariff key to use for non-EUR source corridors
NON_EUR_TARIFF_KEY = {
    "GA_FR": "fcfa_tariffs",
    "CM_FR": "fcfa_tariffs",
    "SN_FR": "fcfa_tariffs",
    "MA_FR": "mad_tariffs",
    "SN_GA": "fcfa_tariffs",
    "GA_SN": "fcfa_tariffs",
    "MA_GA": "mad_tariffs",
    "GA_MA": "fcfa_tariffs",
    "SN_MA": "fcfa_tariffs",
    "MA_SN": "mad_tariffs",
}


def get_tariffs(key):
    try:
        return Settings.objects.get(key=key).value.get("tariffs", [])
    except Settings.DoesNotExist:
        return []


def get_rate_for_corridor(corridor: str) -> Decimal:
    """
    Get the latest exchange rate for a corridor from the database.
    Since base is EUR in BDD, we cross-calculate for non-EUR pairs.
    """
    from rates.models import RatesHistory

    currencies = CORRIDOR_CURRENCIES.get(corridor, {"src": "EUR", "tgt": "XAF"})
    src_currency = currencies["src"]
    tgt_currency = currencies["tgt"]

    latest = RatesHistory.objects.order_by("-date", "-fetched_at").first()
    rates_data = latest.rates if latest and latest.rates else {}

    def get_rate(ccy: str) -> Decimal:
        if ccy == "EUR":
            return Decimal("1")
        if ccy in rates_data and rates_data[ccy] is not None:
            return Decimal(str(rates_data[ccy]))
        return STATIC_RATES.get(ccy, Decimal("655.957"))

    rate_src = get_rate(src_currency)
    rate_tgt = get_rate(tgt_currency)

    # Cross rate: 1 SRC = (rate_tgt / rate_src) TGT
    cross_rate = rate_tgt / rate_src if rate_src > 0 else Decimal("0")
    return cross_rate.quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)


def recalculate(state: dict) -> dict:
    """
    Recalculate a transfer simulation based on the current state.
    Rate is fetched from the database automatically based on the corridor.
    Inputs are validated/coerced defensively (consumer is WS-facing).
    """
    corridor = state.get("corridor", "FR_GA")
    if corridor not in CORRIDOR_CURRENCIES:
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

    # Airtel only applies to Gabon destinations
    if corridor not in AIRTEL_CORRIDORS:
        include_airtel = False

    # Rate from BDD (ignore any client-sent rate)
    rate = get_rate_for_corridor(corridor)

    is_eur_source = corridor.startswith("FR_")
    currencies = CORRIDOR_CURRENCIES[corridor]
    currency_sent = currencies["src"]
    currency_received = currencies["tgt"]

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

    amount_received = (amount * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    airtel_fee_target = Decimal("0")
    airtel_fee_source = Decimal("0")

    if include_airtel:
        # Airtel is 3% of the received amount in XAF
        calculated_fee = (amount_received * Decimal("0.03")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        airtel_fee_xaf = min(calculated_fee, Decimal("5000"))

        airtel_fee_target = airtel_fee_xaf
        # We need to convert the airtel fee back to the source currency to add it to total_to_send
        airtel_fee_source = (airtel_fee_xaf / rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) if rate > 0 else Decimal("0")

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
