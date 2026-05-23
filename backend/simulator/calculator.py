"""
Transfer simulation calculator.
Computes fees, applies exchange rate, returns breakdown.
Rate is fetched from the database (RatesHistory), with a static fallback.

Strategies de tarification (definies dans Settings['corridor_fee_rules']) :
  - "tiers"   : grille a paliers (utilise eur_tariffs / fcfa_tariffs / mad_tariffs)
  - "percent" : pourcentage simple du montant (ex. 4.5%)

Si un corridor n'a pas de regle explicite, on retombe sur la grille a paliers
par defaut (eur_tariffs si la source est EUR, sinon une grille par devise).
Tout est lu depuis la table Settings et donc 100% modifiable depuis l'admin.
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
# Uniquement quand la destination est le Gabon (Airtel n'est pertinent
# que pour le retrait d'argent au Gabon).
AIRTEL_CORRIDORS = {"FR_GA", "SN_GA", "MA_GA"}

# Mapping de fallback : si aucune regle "corridor_fee_rules" n'est definie
# pour un corridor source non-EUR, on tombe sur cette grille par devise.
DEFAULT_TARIFF_KEY_BY_SOURCE = {
    "EUR": "eur_tariffs",
    "XAF": "fcfa_tariffs",
    "XOF": "fcfa_tariffs",
    "MAD": "mad_tariffs",
}


# --------------------------------------------------------------------------
# Acces aux settings (cache desactive — la table est petite et editable a chaud)
# --------------------------------------------------------------------------

def _get_setting_value(key, default=None):
    try:
        return Settings.objects.get(key=key).value
    except Settings.DoesNotExist:
        return default


def get_tariffs(key):
    """Retourne la liste de paliers d'un eur_tariffs/fcfa_tariffs/mad_tariffs."""
    val = _get_setting_value(key, {})
    return (val or {}).get("tariffs", [])


def get_corridor_rules():
    """
    Retourne la map corridor -> regle de frais.
    Forme attendue dans Settings['corridor_fee_rules']:
        {
          "rules": {
            "FR_GA": {"strategy": "tiers",   "tariff_key": "eur_tariffs"},
            "GA_SN": {"strategy": "percent", "percent": 4.5},
            ...
          }
        }
    """
    val = _get_setting_value("corridor_fee_rules", {}) or {}
    return val.get("rules", {})


def get_amount_limits(currency: str):
    """
    Retourne (min, max) pour la devise source, depuis Settings['amount_limits'].
    Forme :
        {"limits": {"EUR": {"min": 15, "max": 760},
                    "XAF": {"min": 10000, "max": 500000},
                    "XOF": {"min": 10000, "max": 500000},
                    "MAD": {"min": 150, "max": 7500}}}
    Si rien n'est defini, on retourne (Decimal("0"), Decimal("10000000")).
    """
    val = _get_setting_value("amount_limits", {}) or {}
    limits = (val.get("limits") or {}).get(currency, {})
    try:
        mn = Decimal(str(limits.get("min", 0)))
    except (InvalidOperation, TypeError):
        mn = Decimal("0")
    try:
        mx = Decimal(str(limits.get("max", 10000000)))
    except (InvalidOperation, TypeError):
        mx = Decimal("10000000")
    return mn, mx


# --------------------------------------------------------------------------
# Taux de change
# --------------------------------------------------------------------------

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
            try:
                return Decimal(str(rates_data[ccy]))
            except (InvalidOperation, TypeError):
                pass
        return STATIC_RATES.get(ccy, Decimal("655.957"))

    rate_src = get_rate(src_currency)
    rate_tgt = get_rate(tgt_currency)

    cross_rate = rate_tgt / rate_src if rate_src > 0 else Decimal("0")
    return cross_rate.quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)


# --------------------------------------------------------------------------
# Calcul des frais Adoro selon la strategie du corridor
# --------------------------------------------------------------------------

def _fee_from_tiers(amount: Decimal, tariffs: list) -> Decimal:
    """Cherche le palier qui matche le montant."""
    for t in tariffs:
        try:
            min_amt = Decimal(str(t.get("min", 0)))
        except (InvalidOperation, TypeError):
            continue
        max_amt = t.get("max")
        if max_amt is not None:
            try:
                max_amt = Decimal(str(max_amt))
            except (InvalidOperation, TypeError):
                max_amt = None
        if amount >= min_amt and (max_amt is None or amount <= max_amt):
            try:
                return Decimal(str(t.get("fee", 0)))
            except (InvalidOperation, TypeError):
                return Decimal("0")
    return Decimal("0")


def compute_adoro_fee(corridor: str, amount: Decimal, source_currency: str) -> Decimal:
    """
    Applique la strategie du corridor :
      - "percent"  -> amount * pct / 100
      - "tiers"    -> grille a paliers (tariff_key)
      - aucune     -> fallback sur la grille de la devise source
    """
    if amount <= 0:
        return Decimal("0")

    rules = get_corridor_rules()
    rule = rules.get(corridor)

    if rule:
        strategy = rule.get("strategy")
        if strategy == "percent":
            try:
                pct = Decimal(str(rule.get("percent", 0)))
            except (InvalidOperation, TypeError):
                pct = Decimal("0")
            fee = (amount * pct / Decimal("100")).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            return fee
        if strategy == "tiers":
            tariff_key = rule.get("tariff_key") or DEFAULT_TARIFF_KEY_BY_SOURCE.get(
                source_currency, "eur_tariffs"
            )
            return _fee_from_tiers(amount, get_tariffs(tariff_key))

    # Pas de regle explicite -> fallback par devise source.
    tariff_key = DEFAULT_TARIFF_KEY_BY_SOURCE.get(source_currency, "eur_tariffs")
    return _fee_from_tiers(amount, get_tariffs(tariff_key))


# --------------------------------------------------------------------------
# Recalcul complet d'une simulation
# --------------------------------------------------------------------------

def recalculate(state: dict) -> dict:
    """
    Recalculate a transfer simulation based on the current state.
    Rate, fees, limits are all read from the database.
    Client inputs are validated/coerced defensively.
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
    # Garde fou absolu (la vraie limite metier vient de get_amount_limits).
    if amount > Decimal("10000000"):
        amount = Decimal("10000000")

    include_airtel = bool(
        state.get("include_airtel_fee", state.get("includeAirtel", False))
    )

    if corridor not in AIRTEL_CORRIDORS:
        include_airtel = False

    currencies = CORRIDOR_CURRENCIES[corridor]
    currency_sent = currencies["src"]
    currency_received = currencies["tgt"]

    rate = get_rate_for_corridor(corridor)

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

    adoro_fee = compute_adoro_fee(corridor, amount, currency_sent)

    amount_received = (amount * rate).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )

    airtel_fee_target = Decimal("0")
    airtel_fee_source = Decimal("0")

    if include_airtel:
        # Airtel : 3% du montant recu en XAF, plafonne a 5000 FCFA
        # (specification ANNEXE 1 - frais de retrait Airtel Money).
        calculated_fee = (amount_received * Decimal("0.03")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        airtel_fee_xaf = min(calculated_fee, Decimal("5000"))
        airtel_fee_target = airtel_fee_xaf
        airtel_fee_source = (
            (airtel_fee_xaf / rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            if rate > 0
            else Decimal("0")
        )

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
