from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Lists all user accounts'

    def handle(self, *args, **kwargs):
        users = User.objects.all().order_by('date_joined').distinct()
        self.stdout.write(self.style.SUCCESS(f'Total users: {users.count()}'))
        self.stdout.write(self.style.SUCCESS('=' * 40))
        
        for user in users:
            self.stdout.write(
                self.style.SUCCESS(f"\nUser Details:\n") +
                f"Username: {user.username}\n"
                f"Email: {user.email}\n"
                f"Date joined: {user.date_joined}\n"
                f"Last login: {user.last_login}\n"
                f"Is active: {user.is_active}\n"
                f"Is staff: {user.is_staff}\n" +
                self.style.SUCCESS('-' * 40)
            )