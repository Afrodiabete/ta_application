
from django.core.management.base import BaseCommand
from src.models import Course

class Command(BaseCommand):
    help = 'Populates the Course table with initial data'

    def handle(self, *args, **options):
        courses = [
            { "idcourse": "CNIT-543", "title": "HCI in Games & Education", "description": "This course focuses on Human-Computer Interaction..." },
            { "idcourse": "CGT-512", "title": "Computer Graphics", "description": "Advanced rendering techniques and shader programming." },
            { "idcourse": "CNIT-272", "title": "Network Fundamentals", "description": "Basics of TCP/IP, routing, and switching." },
            { "idcourse": "CGT-545", "title": "Game Development", "description": "Game Development" },
        ]

        for c in courses:
            course, created = Course.objects.get_or_create(
                idcourse=c['idcourse'],
                defaults={
                    'title': c['title'],
                    'description': c['description']
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created course: {course.idcourse}"))
            else:
                self.stdout.write(self.style.WARNING(f"Course already exists: {course.idcourse}"))
