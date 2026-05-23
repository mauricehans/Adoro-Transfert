from django.urls import path

from . import views

urlpatterns = [
    path("simulator/calculate/", views.TransactionCalculateView.as_view(), name="simulator_calculate"),
    path("transactions/", views.TransactionCreateView.as_view(), name="transaction_create"),
    path("transactions/list/", views.TransactionListView.as_view(), name="transaction_list"),
    path("transactions/<uuid:pk>/", views.TransactionDetailView.as_view(), name="transaction_detail"),
    path("transactions/export/", views.TransactionExportView.as_view(), name="transaction_export"),
]
