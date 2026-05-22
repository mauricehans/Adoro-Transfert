"""
Serializers for the simulator app.

SECURITY: The Transaction creation serializer NEVER trusts client-sent
amounts, fees or rates. All monetary values are recomputed server-side
from the canonical inputs (corridor, amount_sent, include_airtel_fee)
using simulator.calculator.recalculate().
"""

import re
from decimal import Decimal

from rest_framework import serializers

from .calculator import (
    AIRTEL_CORRIDORS,
    CORRIDOR_CURRENCY_MAP,
    recalculate,
)
from .models import Transaction


VALID_CORRIDORS = set(CORRIDOR_CURRENCY_MAP.keys())
PHONE_RE = re.compile(r"^\+?[0-9\s\-().]{6,30}$")


class TransactionCreateSerializer(serializers.ModelSerializer):
    """
    Public endpoint for the public simulator.

    We only accept these inputs from the client:
        - corridor
        - amount_sent
        - include_airtel_fee (optional)
        - beneficiary_name, beneficiary_phone, beneficiary_email
    Everything else (fees, total, received amount, rate, currencies)
    is recomputed on the server.
    """

    # Inputs only - intentionally NOT in Meta.fields so they're not persisted as-is
    include_airtel_fee = serializers.BooleanField(required=False, default=False, write_only=True)

    class Meta:
        model = Transaction
        fields = (
            "id",
            "corridor",
            "amount_sent",
            "include_airtel_fee",
            # output (read-only after compute)
            "currency_sent",
            "amount_received",
            "currency_received",
            "fees_adoro",
            "fees_airtel",
            "total_to_send",
            "rate_used",
            "beneficiary_name",
            "beneficiary_phone",
            "beneficiary_email",
            "created_at",
        )
        read_only_fields = (
            "id",
            "currency_sent",
            "amount_received",
            "currency_received",
            "fees_adoro",
            "fees_airtel",
            "total_to_send",
            "rate_used",
            "created_at",
        )

    # ---------- validators ----------

    def validate_corridor(self, value):
        if value not in VALID_CORRIDORS:
            raise serializers.ValidationError(
                f"Corridor invalide. Valeurs autorisees: {sorted(VALID_CORRIDORS)}"
            )
        return value

    def validate_amount_sent(self, value):
        if value is None or Decimal(str(value)) <= 0:
            raise serializers.ValidationError("Le montant doit etre strictement positif.")
        if Decimal(str(value)) > Decimal("10000000"):
            raise serializers.ValidationError("Montant trop eleve.")
        return value

    def validate_beneficiary_name(self, value):
        v = (value or "").strip()
        if len(v) < 2:
            raise serializers.ValidationError("Nom du beneficiaire requis (min 2 caracteres).")
        if len(v) > 200:
            raise serializers.ValidationError("Nom trop long.")
        return v

    def validate_beneficiary_phone(self, value):
        if not value:
            return ""
        v = value.strip()
        if not PHONE_RE.match(v):
            raise serializers.ValidationError("Numero de telephone invalide.")
        return v

    def validate(self, attrs):
        corridor = attrs.get("corridor")
        phone = attrs.get("beneficiary_phone", "")
        email = attrs.get("beneficiary_email", "")

        # Africa corridors require a phone, Morocco/PayPal requires an email
        if corridor in AIRTEL_CORRIDORS and not phone:
            raise serializers.ValidationError(
                {"beneficiary_phone": "Telephone du beneficiaire requis pour ce corridor."}
            )
        if corridor in ("FR_MA", "MA_FR") and not email and not phone:
            raise serializers.ValidationError(
                {"beneficiary_email": "Email ou telephone requis pour le corridor Maroc."}
            )

        return attrs

    # ---------- create (server-side recompute) ----------

    def create(self, validated_data):
        corridor = validated_data["corridor"]
        amount_sent = Decimal(str(validated_data["amount_sent"]))
        include_airtel = validated_data.pop("include_airtel_fee", False)

        result = recalculate({
            "corridor": corridor,
            "amount": amount_sent,
            "include_airtel_fee": include_airtel,
        })

        # Overwrite/inject the trusted server-side values
        validated_data["amount_sent"] = result["amount_sent"]
        validated_data["currency_sent"] = result["currency_sent"]
        validated_data["amount_received"] = result["amount_received"]
        validated_data["currency_received"] = result["currency_received"]
        validated_data["fees_adoro"] = result["adoro_fee"]
        validated_data["fees_airtel"] = result["airtel_fee"]
        validated_data["total_to_send"] = result["total_to_send"]
        validated_data["rate_used"] = result["rate"]

        return super().create(validated_data)


class TransactionListSerializer(serializers.ModelSerializer):
    """Serializer for admin listing of transactions."""

    class Meta:
        model = Transaction
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")


class TransactionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for admin updates (status, notes)."""

    VALID_STATUSES = {choice for choice, _ in Transaction.Status.choices}

    class Meta:
        model = Transaction
        fields = ("status", "admin_notes")

    def validate_status(self, value):
        if value not in self.VALID_STATUSES:
            raise serializers.ValidationError(
                f"Statut invalide. Valeurs autorisees: {sorted(self.VALID_STATUSES)}"
            )
        return value
