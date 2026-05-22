"""
URL configuration for adoro project.
"""

from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import CustomTokenObtainPairView

urlpatterns = [
    path("admin/", admin.site.urls),
    # JWT Authentication (accepts username OR email)
    path("api/auth/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # App endpoints
    path("api/", include("rates.urls")),
    path("api/", include("tariffs.urls")),
    path("api/", include("simulator.urls")),
    path("api/", include("accounts.urls")),
    path("api/", include("kpis.urls")),
]
