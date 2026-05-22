import csv

from django.db.models import Q
from django.http import HttpResponse
from rest_framework import generics, permissions, status
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework.response import Response

from notifications.tasks import send_notification_email
from .models import Transaction
from .serializers import (
    TransactionCreateSerializer,
    TransactionListSerializer,
    TransactionUpdateSerializer,
)


class TransactionCreateView(generics.CreateAPIView):
    """
    Public endpoint to submit a new transfer simulation.
    After saving, triggers an email notification to the admin
    (email address read from BDD Settings table).
    """

    serializer_class = TransactionCreateSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "transactions"

    def perform_create(self, serializer):
        transaction = serializer.save()
        send_notification_email.delay(str(transaction.id))


class TransactionListView(generics.ListAPIView):
    """Admin endpoint to list all transactions with filtering."""

    serializer_class = TransactionListSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        queryset = Transaction.objects.all()
        status_filter = self.request.query_params.get("status")
        corridor = self.request.query_params.get("corridor")
        search = self.request.query_params.get("search")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if corridor:
            queryset = queryset.filter(corridor=corridor)
        if search:
            queryset = queryset.filter(
                Q(beneficiary_name__icontains=search)
                | Q(beneficiary_phone__icontains=search)
            )
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        return queryset


class TransactionUpdateView(generics.UpdateAPIView):
    """Admin endpoint to update transaction status/notes."""

    serializer_class = TransactionUpdateSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Transaction.objects.all()
    http_method_names = ["patch"]


class TransactionExportView(APIView):
    """Admin endpoint to export transactions as CSV."""

    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        fmt = request.query_params.get("format", "csv")
        if fmt != "csv":
            return Response(
                {"error": "Only CSV format is supported."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        transactions = Transaction.objects.all().order_by("-created_at")

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="transactions_adoro.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "ID", "Corridor", "Montant envoye", "Devise envoi",
            "Montant recu", "Devise reception", "Frais Adoro",
            "Frais Airtel", "Total", "Taux",
            "Beneficiaire", "Tel", "Email",
            "Statut", "Email envoye", "Date",
        ])

        for t in transactions:
            writer.writerow([
                str(t.id)[:8],
                t.corridor,
                t.amount_sent,
                t.currency_sent,
                t.amount_received,
                t.currency_received,
                t.fees_adoro,
                t.fees_airtel,
                t.total_to_send,
                t.rate_used,
                t.beneficiary_name,
                t.beneficiary_phone,
                t.beneficiary_email,
                t.get_status_display(),
                "Oui" if t.email_sent else "Non",
                t.created_at.strftime("%Y-%m-%d %H:%M"),
            ])

        return response
