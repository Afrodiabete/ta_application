from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    # path('logout/', views.logout_view, name='logout'), # Now handled in project urls
    path('app/', views.frontend_app, name='frontend_app'),
    path('password-reset-request/', views.password_reset_request, name='password_reset_request'),
    path('password-reset/', views.password_reset, name='password_reset'),
    
    # API endpoints
    path('submit_application/', views.submit_application, name='submit_application'),
    path('submit_faculty_evaluation/', views.submit_faculty_evaluation, name='submit_faculty_evaluation'),
    path('download_resume/<str:student_email>/', views.download_resume, name='download_resume'),
]
