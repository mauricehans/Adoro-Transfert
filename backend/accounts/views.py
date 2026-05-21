from rest_framework import generics, permissions

from .models import AdminUser
from .serializers import AdminUserSerializer


class CurrentUserView(generics.RetrieveAPIView):
    """Return the currently authenticated user's profile."""

    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    """List all admin users (super_admin only)."""

    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = AdminUser.objects.filter(is_active=True).order_by("username")
