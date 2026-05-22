from django.urls import path
from . import views

urlpatterns = [
    path('kpis/', views.DashboardKPIsView.as_view(), name='dashboard-kpis'),
]