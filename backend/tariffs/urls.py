from django.urls import path

from . import views

urlpatterns = [
    path("tariffs/", views.FeesGridListView.as_view(), name="tariffs_list"),
    path("tariffs/<int:pk>/", views.FeesGridUpdateView.as_view(), name="tariffs_update"),
    path("settings/public/", views.SettingsPublicView.as_view(), name="settings_public"),
    path("settings/", views.SettingsListView.as_view(), name="settings_list"),
    path("settings/<str:pk>/", views.SettingsUpdateView.as_view(), name="settings_update"),
]
