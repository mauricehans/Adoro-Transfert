"""
URL configuration for adoro project.
"""

from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    # JWT Authentication
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # App endpoints
    path("api/", include("rates.urls")),
    path("api/", include("tariffs.urls")),
    path("api/", include("simulator.urls")),
    path("api/", include("accounts.urls")),
]
