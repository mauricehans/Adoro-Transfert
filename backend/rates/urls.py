from django.urls import path

from . import views

urlpatterns = [
    path("rates/latest/", views.RatesLatestView.as_view(), name="rates_latest"),
    path("rates/history/", views.RatesHistoryView.as_view(), name="rates_history"),
    path("rates/refresh/", views.RatesRefreshView.as_view(), name="rates_refresh"),
    path("rates/mad-computed/", views.MadComputedTariffsView.as_view(), name="rates_mad_computed"),
]
