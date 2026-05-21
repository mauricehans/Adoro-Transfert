from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import AdminUser


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminUser
        fields = ("id", "username", "email", "first_name", "last_name", "role", "phone", "is_active", "date_joined")
        read_only_fields = ("id", "date_joined")


class AdminUserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new admin users (super_admin only)."""

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = AdminUser
        fields = ("id", "username", "email", "first_name", "last_name", "role", "phone", "password")
        read_only_fields = ("id",)

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = AdminUser(**validated_data)
        user.set_password(password)
        user.is_staff = True
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that accepts username OR email in the 'username' field.
    """

    username_field = "username"

    def validate(self, attrs):
        username_or_email = attrs.get("username", "")
        password = attrs.get("password", "")

        user = authenticate(
            request=self.context.get("request"),
            username=username_or_email,
            password=password,
        )

        if user is None or not user.is_active:
            raise serializers.ValidationError(
                "Identifiants invalides. Utilisez votre nom d'utilisateur ou votre email."
            )

        data = super().validate({"username": user.username, "password": password})
        data["user"] = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
        }
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["username"] = user.username
        return token
