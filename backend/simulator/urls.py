from django.urls import path

from . import views

urlpatterns = [
    path("transactions/", views.TransactionCreateView.as_view(), name="transaction_create"),
    path("transactions/list/", views.TransactionListView.as_view(), name="transaction_list"),
    path("transactions/<uuid:pk>/", views.TransactionUpdateView.as_view(), name="transaction_update"),
    path("transactions/export/", views.TransactionExportView.as_view(), name="transaction_export"),
]
