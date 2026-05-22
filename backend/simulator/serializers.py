from rest_framework import serializers

from .models import Transaction


class TransactionCreateSerializer(serializers.ModelSerializer):
    """Serializer for public transaction creation (simulation submission).
    Accepts the fields sent by the frontend Simulator component."""

    adoro_fee = serializers.DecimalField(max_digits=10, decimal_places=2, source="fees_adoro")
    airtel_fee = serializers.DecimalField(max_digits=10, decimal_places=2, source="fees_airtel")
    rate = serializers.DecimalField(max_digits=12, decimal_places=6, source="rate_used")

    class Meta:
        model = Transaction
        fields = (
            "id",
            "corridor",
            "amount_sent",
            "currency_sent",
            "amount_received",
            "currency_received",
            "adoro_fee",
            "airtel_fee",
            "total_to_send",
            "rate",
            "beneficiary_name",
            "beneficiary_phone",
            "beneficiary_email",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class TransactionListSerializer(serializers.ModelSerializer):
    """Serializer for admin listing of transactions."""

    class Meta:
        model = Transaction
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")


class TransactionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for admin updates (status, notes)."""

    class Meta:
        model = Transaction
        fields = ("status", "admin_notes")
