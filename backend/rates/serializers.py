from rest_framework import serializers

from .models import RatesHistory


class RatesHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RatesHistory
        fields = ("id", "date", "fetched_at", "source", "base_currency", "rates")


class RatesLatestSerializer(serializers.Serializer):
    """Serializer for the public latest rates response."""

    date = serializers.DateField()
    source = serializers.CharField()
    base_currency = serializers.CharField()
    rates = serializers.JSONField()
    fetched_at = serializers.DateTimeField()
