from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import RatesHistory
from .serializers import RatesHistorySerializer, RatesLatestSerializer
from .tasks import fetch_daily_rates


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
        fetch_daily_rates.delay()
        return Response(
            {"detail": "Rates refresh task queued."},
            status=status.HTTP_202_ACCEPTED,
        )
