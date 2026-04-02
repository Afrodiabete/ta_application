
import os
import django
import sys

# Setup Django environment
sys.path.append('c:\\PeerEval\\app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'peereval.settings')
django.setup()

from src.models import Course

def populate():
    courses = [
        { "idcourse": "CNIT-543", "title": "HCI in Games & Education", "description": "This course focuses on Human-Computer Interaction..." },
        { "idcourse": "CGT-512", "title": "Computer Graphics", "description": "Advanced rendering techniques and shader programming." },
        { "idcourse": "CNIT-272", "title": "Network Fundamentals", "description": "Basics of TCP/IP, routing, and switching." }
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
            print(f"Created course: {course.idcourse}")
        else:
            print(f"Course already exists: {course.idcourse}")

if __name__ == '__main__':
    populate()
