from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import RatesHistory
from .serializers import RatesHistorySerializer, RatesLatestSerializer
from .tasks import fetch_daily_rates

FCFA_EUR_FIXED = Decimal("655.957")


class RatesLatestView(APIView):
    """Public endpoint returning the most recent exchange rates (cached 60s)."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "rates"

    @method_decorator(cache_page(60))
    def get(self, request):
        latest = RatesHistory.objects.first()
        if not latest:
            return Response(
                {"detail": "No rates available yet."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = RatesLatestSerializer(latest)
        return Response(serializer.data)


class RatesHistoryView(generics.ListAPIView):
    """Admin endpoint listing rates history."""

    serializer_class = RatesHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = RatesHistory.objects.all()


class RatesRefreshView(APIView):
    """Admin endpoint to manually trigger rates refresh."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        # On execute directement pour que le frontend ait une reponse immediate
        # plutot que d'attendre la task Celery (utile pour l'UX d'actualisation)
        result = fetch_daily_rates()
        return Response(
            {"detail": "Rates refreshed.", "data": result},
            status=status.HTTP_200_OK,
        )


class MadComputedTariffsView(APIView):
    """
    Admin endpoint returning the MAD tariff grid computed from FCFA tariffs.

    Conversion path: CFA → EUR (taux fixe 655.957) → MAD (dernier taux EUR/MAD BDD).
    MAD_value = CFA_value / 655.957 * EUR_MAD_rate
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from tariffs.models import Settings

        # Dernier taux EUR/MAD depuis la BDD
        latest = RatesHistory.objects.order_by("-date", "-fetched_at").first()
        rates_data = latest.rates if latest and latest.rates else {}
        try:
            eur_mad = Decimal(str(rates_data.get("MAD") or "10.90"))
        except (InvalidOperation, TypeError):
            eur_mad = Decimal("10.90")

        # Grille FCFA source
        try:
            fcfa_setting = Settings.objects.get(key="fcfa_tariffs")
            fcfa_tariffs = (fcfa_setting.value or {}).get("tariffs", [])
        except Settings.DoesNotExist:
            fcfa_tariffs = []

        def cfa_to_mad(cfa_val):
            if cfa_val is None:
                return None
            try:
                mad = (Decimal(str(cfa_val)) / FCFA_EUR_FIXED * eur_mad).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )
                return float(mad)
            except (InvalidOperation, TypeError):
                return None

        computed = []
        for row in fcfa_tariffs:
            computed.append(
                {
                    "min_cfa": row.get("min"),
                    "max_cfa": row.get("max"),
                    "fee_cfa": row.get("fee"),
                    "min_mad": cfa_to_mad(row.get("min")),
                    "max_mad": cfa_to_mad(row.get("max")),
                    "fee_mad": cfa_to_mad(row.get("fee")),
                }
            )

        return Response(
            {
                "eur_mad_rate": float(eur_mad),
                "eur_mad_source": latest.source if latest else "static",
                "eur_mad_date": latest.date.isoformat() if latest else None,
                "tariffs": computed,
            }
        )
