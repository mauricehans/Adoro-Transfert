from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import AdminUser
from .serializers import AdminUserSerializer, AdminUserCreateSerializer, CustomTokenObtainPairSerializer


class IsSuperAdmin(permissions.BasePermission):
    """Only allow super_admin users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == AdminUser.Role.SUPER_ADMIN
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    """JWT login accepting username OR email. Rate-limited to 5/min/IP."""

    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


class CurrentUserView(generics.RetrieveAPIView):
    """Return the currently authenticated user's profile."""

    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    """List all admin users (super_admin only)."""

    serializer_class = AdminUserSerializer
    permission_classes = [IsSuperAdmin]
    queryset = AdminUser.objects.filter(is_active=True).order_by("-date_joined")


class UserCreateView(generics.CreateAPIView):
    """Create a new admin user (super_admin only)."""

    serializer_class = AdminUserCreateSerializer
    permission_classes = [IsSuperAdmin]


class UserDetailView(generics.RetrieveUpdateAPIView):
    """Get or update an admin user (super_admin only)."""

    serializer_class = AdminUserSerializer
    permission_classes = [IsSuperAdmin]
    queryset = AdminUser.objects.all()


class UserDeleteView(APIView):
    """Deactivate (soft delete) an admin user (super_admin only)."""

    permission_classes = [IsSuperAdmin]

    def delete(self, request, pk):
        try:
            user = AdminUser.objects.get(pk=pk)
        except AdminUser.DoesNotExist:
            return Response(
                {"detail": "Utilisateur non trouve."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.pk == request.user.pk:
            return Response(
                {"detail": "Vous ne pouvez pas supprimer votre propre compte."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = False
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
