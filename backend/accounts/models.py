from django.contrib.auth.models import AbstractUser
from django.db import models


class AdminUser(AbstractUser):
    """Custom user model with two roles: admin and super_admin."""

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        SUPER_ADMIN = "super_admin", "Super Admin"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ADMIN,
    )
    phone = models.CharField(max_length=20, blank=True)

    class Meta:
        verbose_name = "Admin User"
        verbose_name_plural = "Admin Users"

    @property
    def is_super_admin(self):
        return self.role == self.Role.SUPER_ADMIN

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"
