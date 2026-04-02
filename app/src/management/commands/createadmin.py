from django.core.management.base import BaseCommand
from src.models import Users
import os

class Command(BaseCommand):
    help = 'Creates a superuser with the specified credentials'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Admin email')
        parser.add_argument('--password', type=str, help='Admin password')

    def handle(self, *args, **options):
        email = options.get('email') or os.getenv('ADMIN_EMAIL')
        password = options.get('password') or os.getenv('ADMIN_PASSWORD')

        if not all([email, password]):
            self.stdout.write(self.style.ERROR('Missing required arguments. Please provide --email and --password'))
            return

        if Users.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f'User with email {email} already exists'))
            return

        Users.objects.create_superuser(email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f'Successfully created admin user with email {email}'))
