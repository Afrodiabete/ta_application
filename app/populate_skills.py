
import os
import django
import sys

# Setup Django environment
sys.path.append('c:\\PeerEval\\app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'peereval.settings')
django.setup()

from src.models import Course, KnowledgeCategory, CourseMustKnow

def populate():
    # 1. Create Knowledge Categories
    categories = [
        {"name": "Python", "level": 1},
        {"name": "Unity", "level": 1},
        {"name": "C#", "level": 1},
        {"name": "Networking", "level": 1},
        {"name": "Maya", "level": 1},
        {"name": "SQL", "level": 1},
    ]
    
    cat_objs = {}
    for c in categories:
        cat, created = KnowledgeCategory.objects.get_or_create(
            categoryName=c['name'],
            defaults={'knowledgeLevel': c['level']}
        )
        cat_objs[c['name']] = cat
        print(f"{'Created' if created else 'Found'} category: {c['name']}")

    # 2. Link to Courses (CourseMustKnow)
    # Course IDs must match what's in DB (from populate_courses.py)
    course_skills = {
        "CNIT-543": ["Unity", "C#", "Python"],
        "CGT-512": ["Maya", "Python"],
        "CNIT-272": ["Networking", "SQL"]
    }

    for course_id, skills in course_skills.items():
        try:
            course = Course.objects.get(idcourse=course_id)
            for skill_name in skills:
                cat = cat_objs.get(skill_name)
                if cat:
                    cmk, created = CourseMustKnow.objects.get_or_create(
                        courseID=course,
                        categoryID=cat
                    )
                    if created:
                        print(f"Linked {skill_name} to {course_id}")
        except Course.DoesNotExist:
            print(f"Course {course_id} not found. Skipping.")

if __name__ == '__main__':
    populate()
