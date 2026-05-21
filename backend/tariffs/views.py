from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FeesGrid, Settings
from .serializers import FeesGridSerializer, SettingsPublicSerializer, SettingsSerializer


class FeesGridListView(generics.ListAPIView):
    """Public endpoint listing active fee schedules."""

    serializer_class = FeesGridSerializer
    permission_classes = [permissions.AllowAny]
    queryset = FeesGrid.objects.filter(active=True)
    pagination_class = None


class FeesGridUpdateView(generics.UpdateAPIView):
    """Admin endpoint to update a fee entry."""

    serializer_class = FeesGridSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = FeesGrid.objects.all()
    http_method_names = ["patch"]


class SettingsPublicView(APIView):
    """Public endpoint returning only public settings."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        settings = Settings.objects.filter(is_public=True)
        serializer = SettingsPublicSerializer(settings, many=True)
        return Response(serializer.data)


class SettingsListView(generics.ListAPIView):
    """Admin endpoint listing all settings."""

    serializer_class = SettingsSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Settings.objects.all()
    pagination_class = None


class SettingsUpdateView(generics.UpdateAPIView):
    """Admin endpoint to update a setting."""

    serializer_class = SettingsSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Settings.objects.all()
    http_method_names = ["patch"]

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
