import datetime
from django.utils import timezone
from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from simulator.models import Transaction

class DashboardKPIsView(APIView):
    """
    Endpoint to retrieve KPIs for the admin dashboard.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        now = timezone.now()
        
        simulations_24h = Transaction.objects.filter(
            created_at__gte=now - datetime.timedelta(days=1)
        ).count()
        
        simulations_7j = Transaction.objects.filter(
            created_at__gte=now - datetime.timedelta(days=7)
        ).count()
        
        simulations_30j = Transaction.objects.filter(
            created_at__gte=now - datetime.timedelta(days=30)
        ).count()
        
        total_transactions = Transaction.objects.count()

        return Response({
            "simulations24h": simulations_24h,
            "simulations7j": simulations_7j,
            "simulations30j": simulations_30j,
            "totalTransactions": total_transactions,
        })