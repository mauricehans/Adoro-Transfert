from django.core.management.base import BaseCommand

from accounts.models import AdminUser


class Command(BaseCommand):
    help = "Create the default super admin user"

    def handle(self, *args, **options):
        username = "maurice"
        email = "ngomeobiangmaurice@gmail.com"
        password = "Narutofive5"

        if AdminUser.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f"User '{username}' already exists."))
            user = AdminUser.objects.get(username=username)
            user.role = AdminUser.Role.SUPER_ADMIN
            user.is_staff = True
            user.is_superuser = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Role updated to super_admin."))
            return

        user = AdminUser.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name="Maurice",
            last_name="Ngome Obiang",
            role=AdminUser.Role.SUPER_ADMIN,
            is_staff=True,
            is_superuser=True,
        )
        self.stdout.write(self.style.SUCCESS(
            f"Super Admin created:\n"
            f"  Username: {username}\n"
            f"  Email: {email}\n"
            f"  Role: super_admin\n"
            f"  Login with username or email."
        ))
