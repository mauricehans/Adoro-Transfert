from rest_framework import serializers

from .models import FeesGrid, Settings


class FeesGridSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeesGrid
        fields = (
            "id",
            "corridor",
            "currency",
            "min_amount",
            "max_amount",
            "fee_amount",
            "fee_percent",
            "active",
        )


class SettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settings
        fields = ("key", "value", "description", "is_public", "updated_at", "updated_by")
        read_only_fields = ("updated_at", "updated_by")


class SettingsPublicSerializer(serializers.ModelSerializer):
    """Serializer for public settings (no admin fields)."""

    class Meta:
        model = Settings
        fields = ("key", "value")
