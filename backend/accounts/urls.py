from django.urls import path

from . import views

urlpatterns = [
    path("auth/me/", views.CurrentUserView.as_view(), name="current_user"),
    path("users/", views.UserListView.as_view(), name="user_list"),
]
