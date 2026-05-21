from rest_framework import serializers

from .models import AdminUser


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminUser
        fields = ("id", "username", "email", "first_name", "last_name", "role", "phone", "is_active")
        read_only_fields = ("id",)
