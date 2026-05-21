from rest_framework import serializers

from .models import Transaction


class TransactionCreateSerializer(serializers.ModelSerializer):
    """Serializer for public transaction creation (simulation submission)."""

    class Meta:
        model = Transaction
        fields = (
            "id",
            "corridor",
            "amount_sent",
            "amount_received",
            "fees",
            "rate_applied",
            "include_airtel",
            "sender_name",
            "sender_phone",
            "sender_email",
            "beneficiary_name",
            "beneficiary_phone",
            "beneficiary_city",
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
