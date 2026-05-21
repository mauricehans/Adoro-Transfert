"""
Transfer simulation calculator.
Computes fees, applies exchange rate, returns breakdown.
"""

from decimal import Decimal, ROUND_HALF_UP

from tariffs.models import FeesGrid


def recalculate(state: dict) -> dict:
    """
    Recalculate a transfer simulation based on the current state.

    Args:
        state: dict with keys:
            - corridor: str (e.g., "EUR_XAF" or "EUR_XOF")
            - amount: float/str (amount in EUR)
            - includeAirtel: bool
            - rate: float/str (exchange rate EUR -> target currency)

    Returns:
        dict with breakdown:
            - amount_sent: Decimal
            - fees: Decimal
            - total_debited: Decimal
            - rate_applied: Decimal
            - amount_received: Decimal
    """
    corridor = state.get("corridor", "EUR_XAF")
    amount = Decimal(str(state.get("amount", 0)))
    include_airtel = state.get("includeAirtel", False)
    rate = Decimal(str(state.get("rate", "655.957")))

    if amount <= 0:
        return {
            "amount_sent": Decimal("0"),
            "fees": Decimal("0"),
            "total_debited": Decimal("0"),
            "rate_applied": rate,
            "amount_received": Decimal("0"),
        }

    # Find applicable fee from the grid
    fee_entry = (
        FeesGrid.objects.filter(
            corridor=corridor,
            min_amount__lte=amount,
            max_amount__gte=amount,
            active=True,
        )
        .first()
    )

    fees = Decimal("0")
    if fee_entry:
        # Fixed fee + percentage fee
        fees = fee_entry.fee_amount + (amount * fee_entry.fee_percent / Decimal("100"))
        fees = fees.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # Airtel Money surcharge (flat 500 FCFA converted back to EUR)
    airtel_surcharge_eur = Decimal("0")
    if include_airtel and rate > 0:
        airtel_surcharge_fcfa = Decimal("500")
        airtel_surcharge_eur = (airtel_surcharge_fcfa / rate).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        fees += airtel_surcharge_eur

    total_debited = amount + fees
    amount_received = (amount * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return {
        "amount_sent": amount,
        "fees": fees,
        "total_debited": total_debited,
        "rate_applied": rate,
        "amount_received": amount_received,
    }
