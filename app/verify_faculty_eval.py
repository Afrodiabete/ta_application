
from src.models import Student, Course, KnowledgeCategory, CourseStudentYearKnowledge, Users
from django.test import RequestFactory
from src.views import submit_faculty_evaluation
import json

def test_faculty_evaluation():
    print("Setting up test data...")
    # Create required objects
    # Use shorter email (max 25 chars in model)
    student_email = "test_eval@purdue.edu" 
    course_code = "TEST-EVAL-101"
    
    # Ensure course exists
    course, _ = Course.objects.get_or_create(
        idcourse=course_code,
        defaults={'title': 'Test Eval Course', 'description': 'Test Description'}
    )
    
    # Ensure student exists
    student, _ = Student.objects.get_or_create(
        email=student_email,
        defaults={'firstName': 'Test', 'lastName': 'Student'}
    )
    
    # Ensure category exists
    category, _ = KnowledgeCategory.objects.get_or_create(
        categoryName='Test Skill',
        defaults={'knowledgeLevel': 1}
    )
    
    # Ensure CSYK record exists (Prerequisite for evaluation)
    CourseStudentYearKnowledge.objects.update_or_create(
        courseID=course,
        studentID=student,
        year='2026',
        catID=category,
        defaults={
            'level': 3,
            'courseTaken': 'No',
            'knowledgeLevel': 3,
            'courseKnowledge': 'Background info'
        }
    )
    
    print("Simulating faculty evaluation submission...")
    factory = RequestFactory()
    data = {
        'applicant_id': student_email,
        'course_id': course_code,
        'year': '2026',
        'overall_recommendation': 'Strongly Recommend',
        'comments': 'Excellent candidate.'
    }
    
    # Create faculty user
    faculty_user, _ = Users.objects.get_or_create(
        email='faculty@purdue.edu', 
        defaults={'is_staff': True, 'is_active': True}
    )
    
    request = factory.post('/submit_faculty_evaluation/', data=data)
    request.user = faculty_user
    
    # DEBUG: Check DB before view call
    print(f"DEBUG PRE-CHECK: Searching for Student='{student_email}', Course='{course_code}', Year='2026'")
    pre_count = CourseStudentYearKnowledge.objects.filter(
        studentID__email=student_email,
        courseID__idcourse=course_code,
        year='2026'
    ).count()
    print(f"DEBUG PRE-CHECK: Found {pre_count} records.")
    
    # Call the view
    response = submit_faculty_evaluation(request)
    print(f"Response status: {response.status_code}")
    print(f"Response content: {response.content.decode()}")
    
    if response.status_code == 200:
        print("Verifying database...")
        # Check DB
        try:
            entry = CourseStudentYearKnowledge.objects.get(
                studentID=student,
                courseID=course,
                catID=category,
                year='2026'
            )
            
            print(f"Entry found: {entry}")
            print(f"Recommendation: '{entry.overallRecommendation}'")
            print(f"Comments: '{entry.comments}'")
            
            if entry.overallRecommendation == 'Strongly Recommend' and entry.comments == 'Excellent candidate.':
                print("SUCCESS: Faculty evaluation saved correctly.")
            else:
                print("FAILURE: Data mismatch.")
                
        except Exception as e:
            print(f"FAILURE: Database verification failed: {e}")
            
    else:
        print("FAILURE: Submission request failed.")

if __name__ == "__main__":
    test_faculty_evaluation()
