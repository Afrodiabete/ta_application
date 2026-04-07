from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.views.decorators.clickjacking import xframe_options_exempt
from src.models import Users
from django.utils import timezone
from src.forms import PasswordResetRequestForm, PasswordResetCodeForm, PasswordResetForm, LoginForm, RegistrationForm
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.views import LogoutView
from django.http import HttpResponse, FileResponse
from django.conf import settings
from django.core.mail import send_mail
from pathlib import Path
import os
import secrets
from datetime import datetime, timedelta

@login_required
def index(request):
    """
    Simplified index view. Redirects to the implementation of the frontend app 
    or just stays here if we want a landing page.
    Since we stripped everything, let's redirect to 'frontend_app'.
    """
    return redirect('frontend_app')

class CustomLogoutView(LogoutView):
    def dispatch(self, request, *args, **kwargs):
        response = super().dispatch(request, *args, **kwargs)
        messages.success(request, 'You have been successfully logged out.')
        return redirect('login')

def password_reset_request(request):
    pending_keys = ['pending_reset_user_id', 'pending_reset_code', 'pending_reset_expires']
    request_form = PasswordResetRequestForm()
    code_form = PasswordResetCodeForm()
    show_code = 'pending_reset_user_id' in request.session

    if request.method == 'POST':
        if 'verification_code' in request.POST:
            show_code = True
            code_form = PasswordResetCodeForm(request.POST)
            pending_user_id = request.session.get('pending_reset_user_id')
            pending_code = request.session.get('pending_reset_code')
            pending_expires = request.session.get('pending_reset_expires')

            if not all([pending_user_id, pending_code, pending_expires]):
                messages.error(request, 'Verification code is not available. Please request a new one.')
            else:
                expires_at = datetime.fromisoformat(pending_expires)
                if timezone.now() > expires_at:
                    for key in pending_keys:
                        request.session.pop(key, None)
                    messages.error(request, 'Verification code has expired. Please request a new one.')
                    show_code = False
                elif code_form.is_valid():
                    if code_form.cleaned_data['verification_code'] == pending_code:
                        request.session['reset_user_id'] = pending_user_id
                        for key in pending_keys:
                            request.session.pop(key, None)
                        messages.success(request, 'Verification successful. Please reset your password.')
                        return redirect('password_reset')
                    else:
                        messages.error(request, 'Invalid verification code. Please try again.')
                else:
                    for field, errors in code_form.errors.items():
                        for error in errors:
                            messages.error(request, error)
        else:
            request_form = PasswordResetRequestForm(request.POST)
            if request_form.is_valid():
                user = request_form.cleaned_data['user']
                verification_code = f"{secrets.randbelow(1000000):06d}"
                request.session['pending_reset_user_id'] = user.id
                request.session['pending_reset_code'] = verification_code
                request.session['pending_reset_expires'] = (timezone.now() + timedelta(minutes=10)).isoformat()
                show_code = True

                try:
                    send_mail(
                        subject=f"{settings.INST_SHORT_NAME} Password Reset Verification Code",
                        message=(
                            f"Your verification code is: {verification_code}\n"
                            "This code expires in 10 minutes."
                        ),
                        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None) or 'no-reply@example.com',
                        recipient_list=[user.email],
                        fail_silently=False,
                    )
                    messages.success(request, 'Verification code sent to your email.')
                except Exception:
                    for key in pending_keys:
                        request.session.pop(key, None)
                    show_code = False
                    messages.error(request, 'Failed to send verification email. Please try again later.')
            else:
                for field, errors in request_form.errors.items():
                    for error in errors:
                        messages.error(request, error)
    
    return render(
        request,
        'registration/password_reset_request.html',
        {'form': request_form, 'code_form': code_form, 'show_code': show_code}
    )

def password_reset(request):
    user_id = request.session.get('reset_user_id')
    if not user_id:
        messages.error(request, 'Invalid password reset request. Please try again.')
        return redirect('password_reset_request')
    
    try:
        user = Users.objects.get(id=user_id)
    except Users.DoesNotExist:
        messages.error(request, 'User not found. Please try again.')
        return redirect('password_reset_request')
    
    if request.method == 'POST':
        form = PasswordResetForm(request.POST)
        if form.is_valid():
            new_password = form.cleaned_data['new_password']
            user.set_password(new_password)
            user.save()
            if 'reset_user_id' in request.session:
                del request.session['reset_user_id']
            messages.success(request, 'Password has been reset successfully. Please login with your new password.')
            return redirect('login')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, error)
    else:
        form = PasswordResetForm()
    
    return render(request, 'registration/password_reset.html', {'form': form})
    
def register(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            auth_login(request, user)
            messages.success(request, f'Account created for {user.email}!')
            return redirect('frontend_app')
    else:
        form = RegistrationForm()
    return render(request, 'registration/register.html', {'form': form})


def login(request):
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            user = form.cleaned_data['user']
            
            if user.last_login is None:
                request.session['reset_user_id'] = user.id
                auth_login(request, user)
                messages.warning(request, 'Please set a password to continue.')
                return redirect('password_reset')
            else:
                auth_login(request, user)
                messages.success(request, f'Welcome back {user.first_name}!')
                return redirect('frontend_app')
        else:
            messages.error(request, 'Invalid email or password')
    else:
        form = LoginForm()
    
    return render(request, 'registration/login.html', {'form': form})

@login_required
def frontend_app(request, path=''):
    """Serve the Dashboard (replaces React app)."""
    from src.models import (
        Course, CourseMustKnow, KnowledgeCategory, 
        Student, CourseStudentYearKnowledge
    )
    import json
    
    # Fetch courses from DB
    courses_qs = Course.objects.all().values('idcourse', 'title', 'description')
    courses_list = [
        {
            'id': c['idcourse'], 
            'title': c['title'], 
            'description': c['description']
        } 
        for c in courses_qs
    ]

    # Fetch Course Skills
    skills_map = {}
    cmk_qs = CourseMustKnow.objects.select_related('categoryID').all()
    
    for cmk in cmk_qs:
        c_id = cmk.courseID.idcourse
        if c_id not in skills_map:
            skills_map[c_id] = []
        skills_map[c_id].append({
            'id': cmk.categoryID.id,
            'name': cmk.categoryID.categoryName
        })

    # Fetch Applicants (Students + their Applications/Skills)
    applicants_map = {}
    
    # Get all students
    students = Student.objects.all()
    for s in students:
        applicants_map[s.email] = {
            'id': s.email, 
            'name': f"{s.firstName} {s.lastName}",
            'email': s.email,
            'dept': s.department,
            'degree': s.degree,
            'experience': s.teachingExperienceText,
            'hasTeachingExp': s.teachingExperienceBool,
            'teachingKnowledge': s.teachingExperienceText, # Duplicate for compatibility
            'appliedAt': "2026-02-12", # Mock date for now
            'term': "Spring 2026", # Default or infer from CSYK
            'subjectTopics': [],
            'resumeUrl': f"/download_resume/{s.email}/" if s.resume else None,
            'applications': {}
        }

    # Get all skills/applications (CSYK)
    # Applying to a course is inferred from having a skill entry for it
    csyk_qs = CourseStudentYearKnowledge.objects.select_related('studentID', 'catID').all()
    
    for item in csyk_qs:
        s_email = item.studentID.email
        if s_email not in applicants_map:
            continue # Should be there, but just in case
            
        app_data = applicants_map[s_email]
        
        # Add Skill
        app_data['subjectTopics'].append({
            'name': item.catID.categoryName,
            'level': item.knowledgeLevel
        })
        
        # Mark as applied to this course
        # Default status 'new' if not present
        c_id = item.courseID.idcourse
        if c_id not in app_data['applications']:
            app_data['term'] = item.year # Update term if available
            app_data['applications'][c_id] = {
                'status': 'evaluated' if item.overallRecommendation else 'new',
                'overall': item.overallRecommendation or '',
                'overallScore': None,
                'specificScore': None,
                'comments': item.comments or '',
                'evaluatedAt': None,
                'knowledge': item.courseKnowledge or ''
            }
            
    applicants_list = list(applicants_map.values())
    
    # Determine User Role
    user_role = 'student'
    current_student_data = {}
    
    if request.user.is_superuser:
        user_role = 'admin'
    elif request.user.is_staff: # or request.user.is_instructor if field exists
        user_role = 'faculty'
    
    # If student, try to fetch existing data
    applied_course_ids = []
    previous_applications = {}
    if user_role == 'student':
        try:
            student = Student.objects.get(email=request.user.email)
            current_student_data = {
                'firstName': student.firstName,
                'lastName': student.lastName,
                'email': student.email,
                'department': student.department,
                'degree': student.degree,
                'campus': student.campus,
                'teachingExperienceBool': student.teachingExperienceBool,
                'teachingExperienceText': student.teachingExperienceText,
                'hasResume': bool(student.resume),
                'enrollmentTerm': student.year,
            }
            
            # Get list of course IDs the student has applied to
            applied_courses = CourseStudentYearKnowledge.objects.filter(
                studentID=student
            ).values_list('courseID__idcourse', flat=True).distinct()
            applied_course_ids = list(applied_courses)
            
            # Get previous application data for each course
            for course_id in applied_course_ids:
                csyk_entries = CourseStudentYearKnowledge.objects.filter(
                    studentID=student,
                    courseID__idcourse=course_id
                ).select_related('catID')
                
                if csyk_entries.exists():
                    # Get basic course info from first entry
                    first_entry = csyk_entries.first()
                    previous_applications[course_id] = {
                        'year': first_entry.year,
                        'courseKnowledge': first_entry.courseKnowledge,
                        'skills': {}
                    }
                    
                    # Collect all skills for this course
                    for entry in csyk_entries:
                        previous_applications[course_id]['skills'][entry.catID.id] = entry.knowledgeLevel
            
        except Student.DoesNotExist:
            # Default to user info
            current_student_data = {
                'firstName': request.user.first_name,
                'lastName': request.user.last_name,
                'email': request.user.email,
            }

    context = {
        'user_role': user_role,
        'current_student_json': json.dumps(current_student_data),
        'applied_courses_json': json.dumps(applied_course_ids),
        'previous_applications_json': json.dumps(previous_applications),
        'courses_json': json.dumps(courses_list),
        'skills_json': json.dumps(skills_map),
        'applicants_json': json.dumps(applicants_list)
    }
    return render(request, 'dashboard.html', context)

# Error handlers
def bad_request(request, exception):
    return render(request, '400.html', status=400)

def permission_denied(request, exception):
    return render(request, '403.html', status=403)

def page_not_found(request, exception):
    return render(request, '404.html', status=404)

def server_error(request):
    return render(request, '500.html', status=500)

@login_required
def submit_application(request):
    if request.method != 'POST':
        return HttpResponse("Method not allowed", status=405)
        
    try:
        from src.models import Student, Course, KnowledgeCategory, CourseStudentYearKnowledge
        
        data = request.POST
        files = request.FILES
        
        # 1. Create/Update Student
        # Mapping frontend fields to model fields
        email = data.get('email')
        if not email:
            return HttpResponse("Email is required", status=400)
            
        defaults_dict = {
            'firstName': data.get('firstName', ''),
            'lastName': data.get('lastName', ''),
            'department': data.get('department', ''),
            'degree': data.get('degree', 'MS'), # Default to MS if missing
            'teachingExperienceBool': data.get('teachingExperienceBool', 'No'),
            'teachingExperienceText': data.get('teachingExperienceText', ''),
            'campus': data.get('campus', 'WL'), # Default West Lafayette
            'year': data.get('enrollmentTerm'),
        }
        if 'resume' in files:
            defaults_dict['resume'] = files['resume'].read()

        student, created = Student.objects.update_or_create(
            email=email,
            defaults=defaults_dict
        )
        
        # 2. Handle CourseStudentYearKnowledge
        # For now, we only have one course selected in the form
        course_id = data.get('courseID')
        if course_id:
            try:
                course = Course.objects.get(idcourse=course_id)
                
                # Iterate through POST data to find skills
                # Format: skill_{catID} = rating
                skills_found = False
                for key, value in data.items():
                    if key.startswith('skill_'):
                        try:
                            cat_id = key.split('_')[1]
                            rating = int(value)
                            
                            category = KnowledgeCategory.objects.get(id=cat_id)
                            
                            CourseStudentYearKnowledge.objects.update_or_create(
                                courseID=course,
                                studentID=student,
                                year=data.get('year', '2026'),
                                catID=category,
                                defaults={
                                    'level': rating, 
                                    'courseTaken': data.get('courseTaken', 'No'),
                                    'knowledgeLevel': rating,
                                    'courseKnowledge': data.get('courseKnowledge', '')
                                }
                            )
                            skills_found = True
                        except (ValueError, IndexError, KnowledgeCategory.DoesNotExist):
                            continue

                # Fallback if no specific skills were found (e.g. course has no requirements defined yet)
                # We might want to create a generic entry or just skip. 
                # For now, if no skills found, we do nothing or maybe log it.
                
            except Course.DoesNotExist:
                pass # Logic to handle invalid course ID, maybe log it
                
        return HttpResponse("Application Submitted Successfully", status=200)
        
    except Exception as e:
        return HttpResponse(f"Error: {str(e)}", status=500)
    except Exception as e:
        return HttpResponse(f"Error: {str(e)}", status=500)

@login_required
@xframe_options_exempt
def download_resume(request, student_email):
    from src.models import Student
    import io
    
    student = get_object_or_404(Student, email=student_email)
    
    if not student.resume:
        return HttpResponse("No resume found", status=404)
        
    # Assuming PDF for now, but could be determined if we stored content_type
    response = HttpResponse(student.resume, content_type='application/pdf')
    response['Content-Disposition'] = 'inline; filename="resume.pdf"'
    return response

@login_required
def submit_faculty_evaluation(request):
    if request.method != 'POST':
        return HttpResponse("Method not allowed", status=405)
    
    try:
        from src.models import Student, Course, CourseStudentYearKnowledge
        
        data = request.POST
        # We need student email and course ID to identify the records
        # The frontend sends 'applicantId' which is the email in our mock data structure
        student_email = data.get('applicant_id') 
        course_id = data.get('course_id')
        
        if not student_email or not course_id:
            return HttpResponse("Missing applicant ID (email) or course ID", status=400)
            
        overall_rec = data.get('overall_recommendation')
        comments = data.get('comments', '')
        
        # Update logic: duplicate the evaluation across all skill entries for this student/course/year
        # We might want to filter by year too if possible, otherwise we update all years?
        # Ideally frontend sends year, or we assume active year.
        # Let's assume we update for all years matching this course+student for now, or just the latest?
        # The frontend dashboard implies a specific term context. 
        # Let's check if year is passed.
        year = data.get('year')

        qs = CourseStudentYearKnowledge.objects.filter(
            studentID__email=student_email,
            courseID__idcourse=course_id
        )
        
        if year:
            qs = qs.filter(year=year)
            
        print(f"DEBUG VIEW: Data records matching filter: {qs.count()}")
        print(f"DEBUG VIEW: Filter params: Student={student_email}, Course={course_id}, Year={year}")

        # Optimization: Use direct ID lookup if possible to ensure update() works smoothly
        # But we already have the IDs (email and course_code are PKs).
        # Let's try explicit iteration if update() is failing, or use _id
        
        # Re-defining QS with direct column lookups to avoid potential join issues with update()
        qs = CourseStudentYearKnowledge.objects.filter(
            studentID_id=student_email,
            courseID_id=course_id
        )
        if year:
            qs = qs.filter(year=year)
            
        count_before = qs.count()
        print(f"DEBUG VIEW: Count match with direct ID lookup: {count_before}")

        updated_count = qs.update(
            overallRecommendation=overall_rec,
            comments=comments
        )
        print(f"DEBUG VIEW: Updated rows: {updated_count}")
        
        if updated_count == 0:
             # It acts like an upsert? No, faculty only evaluates existing applicants.
             # If no records found, maybe the student hasn't applied properly (no skills)?
             return HttpResponse("No application records found to update", status=404)
        
        return HttpResponse(f"Evaluation submitted. Updated {updated_count} records.", status=200)
        
    except Exception as e:
        return HttpResponse(f"Error: {str(e)}", status=500)
