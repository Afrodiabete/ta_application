from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager
from django.utils import timezone

class CustomUserManager(BaseUserManager):
    """
    Custom user model manager where email is the unique identifiers
    for authentication instead of usernames.
    """
    def create_user(self, email, password, **extra_fields):
        """
        Create and save a User with the given email and password.
        """
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        """
        Create and save a SuperUser with the given email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, password, **extra_fields)

class Users(AbstractUser):
    is_instructor = models.BooleanField(default=False, help_text='Whether the user is an instructor.')
    
    # Remove username field and use email as username
    username = None
    email = models.EmailField(unique=True, verbose_name='email address')
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

class Terms(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=16, help_text='The name of the term. (ex. Spring 2025)')
    start_date = models.DateField('Start Date', help_text='The date the term starts')
    end_date = models.DateField('End Date', help_text='The date the term ends')

    class Meta:
        verbose_name = 'Term'
        verbose_name_plural = 'Terms'

    def __str__(self):
        return self.name
    
class Departments(models.Model):
    id = models.CharField('Department ID', max_length=16, primary_key=True, help_text='The institution specific ID for the department. (ex. CNIT, CS, ENGL)')
    name = models.CharField('Department name', max_length=50, help_text='The name of the department. (ex. Computer Science, English)')
    department_head = models.ForeignKey(Users, on_delete=models.SET_NULL, null=True, blank=True, help_text='The department head assigned to the department.', limit_choices_to={'is_instructor': True})

    class Meta:
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'

    def __str__(self):
        return f'{self.id} ({self.name})'
    
class Courses(models.Model):
    id = models.AutoField(primary_key=True)
    course_code = models.CharField('Course Code', max_length=16, help_text='The ID of the course without prefix. (Ex. 101, 17600)')
    name = models.CharField('Course name', max_length=50, help_text='The name of the course. (Ex. Introduction to Computer Science, English Composition I)')
    department = models.ForeignKey(Departments, on_delete=models.CASCADE, to_field='id', help_text='The department the course belongs to (Applys the prefix).')
    coordinator = models.ForeignKey(Users, on_delete=models.SET_NULL, null=True, blank=True, to_field='id', help_text='The course coordinator assigned to the course.', limit_choices_to={'is_instructor': True})
 
    class Meta:
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'

    def __str__(self):
        return f'{self.department.id}{self.course_code} ({self.name})'
    
class Sections(models.Model):
    id = models.AutoField(primary_key=True)
    course = models.ForeignKey(Courses, on_delete=models.CASCADE, to_field='id', related_name='sections')
    section_number = models.CharField(max_length=6)
    term = models.ForeignKey(Terms, on_delete=models.CASCADE, to_field='id')

    class Meta:
        verbose_name = 'Section'
        verbose_name_plural = 'Sections'

    def __str__(self):
        return f'{self.course.department.id}{self.course.course_code}-{self.section_number} ({self.term.name})'

    @classmethod
    def get_active_sections_for_instructor(cls, instructor):
        """
        Returns active sections for a given instructor.
        Active sections are those where the current date falls within the term's start and end dates.
        """
        from datetime import date
        today = date.today()
        
        return cls.objects.filter(
            sectioninstructors__user_id=instructor,
            term__start_date__lte=today,
            term__end_date__gte=today
        ).select_related('course', 'term', 'course__department')

    @classmethod
    def get_past_sections_for_instructor(cls, instructor):
        """
        Returns past sections for a given instructor.
        Past sections are those where the term's end date is before the current date.
        """
        from datetime import date
        today = date.today()
        
        return cls.objects.filter(
            sectioninstructors__user_id=instructor,
            term__end_date__lt=today
        ).select_related('course', 'term', 'course__department').order_by('-term__end_date')
    

class SectionInstructors(models.Model):
    id = models.AutoField(primary_key=True)
    section_id = models.ForeignKey(Sections, on_delete=models.CASCADE, to_field='id')
    user_id = models.ForeignKey(Users, on_delete=models.SET_NULL, null=True, blank=True, to_field='id', help_text='The instructor assigned to the section.', limit_choices_to={'is_instructor': True})

    class Meta:
        verbose_name = 'Section Instructor'
        verbose_name_plural = 'Section Instructors'

    def __str__(self):
        if self.user_id:
            return f'{self.user_id.first_name} {self.user_id.last_name} ({self.section_id.course.department.id}{self.section_id.course.course_code}-{self.section_id.section_number})'
        else:
            return f'Unassigned ({self.section_id.course.department.id}{self.section_id.course.course_code}-{self.section_id.section_number})'

class Groups(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50, help_text='The name or identifier of the group')
    section_id = models.ForeignKey(Sections, on_delete=models.CASCADE, to_field='id')
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        verbose_name = 'Group'
        verbose_name_plural = 'Groups'

    def __str__(self):
        return f'{self.name} ({self.section_id.course.department.id}{self.section_id.course.course_code}-{self.section_id.section_number})'

class Enrollments(models.Model):
    id = models.AutoField(primary_key=True)
    user_id = models.ForeignKey(Users, on_delete=models.CASCADE, to_field='id')
    section_id = models.ForeignKey(Sections, on_delete=models.CASCADE, to_field='id', related_name='enrollments')
    group = models.ForeignKey(Groups, on_delete=models.SET_NULL, null=True, blank=True, help_text="The group the student is assigned to")
    added_by = models.ForeignKey(Users, on_delete=models.SET_NULL, null=True, blank=True, to_field='id', related_name='added_enrollments')
    enrollment_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Enrollment'
        verbose_name_plural = 'Enrollments'

    def __str__(self):
        return f"{self.user_id.first_name} {self.user_id.last_name} ({self.section_id.term.name} {self.section_id.course.department.id}{self.section_id.course.course_code}-{self.section_id.section_number})"

    @property
    def is_enrolled(self):
        return self.enrollment_date is not None
    
    @classmethod
    def get_active_students_for_section(cls, section):
        """
        Returns active students for a given section.
        Active students are those who are enrolled in the section and the current date falls within the term's start and end dates.
        """
        from datetime import date
        today = date.today()
        
        return cls.objects.filter(
            section_id=section,
            enrollment_date__lte=today,
            section_id__term__end_date__gte=today
        )
        

class Assignments(models.Model):
    id = models.AutoField(primary_key=True)
    section_id = models.ForeignKey(Sections, on_delete=models.CASCADE, to_field='id', related_name='assignments')
    name = models.CharField(max_length=50)
    available_date = models.DateTimeField()
    due_date = models.DateTimeField()
    max_points_self = models.IntegerField(default=100, help_text='The maximum points for the student to self-evaluate their own work.')
    max_points_partner = models.IntegerField(default=120, help_text='The maximum points for the student to evaluate their partner.')
    self_eval = models.BooleanField(default=True, help_text='Whether the student can self-evaluate their own work.')
    enable_merits = models.BooleanField(default=True, help_text='Whether to enable merit scoring.')

    class Meta:
        verbose_name = 'Assignment'
        verbose_name_plural = 'Assignments'

    def __str__(self):
        return f"{self.section_id.term.name} {self.section_id.course.department.id}{self.section_id.course.course_code}-{self.section_id.section_number} {self.name}"
        
    @property
    def is_active(self):
        """Check if the assignment is currently active (between available_date and due_date)"""
        now = timezone.now()
        return self.available_date <= now and self.due_date >= now
        
    def get_evaluations_total_for_user(self, user_id, exclude_evaluation_id=None):
        """
        Calculate the total points assigned by a user for all evaluations in this assignment.
        
        Args:
            user_id: The user ID of the evaluator
            exclude_evaluation_id: Optional ID of an evaluation to exclude from the total
            
        Returns:
            int: The total points assigned by the user
        """
        from src.models import Evaluations
        
        evaluations = Evaluations.objects.filter(
            assignment_id=self,
            evaluator_id=user_id
        )
        
        if exclude_evaluation_id:
            evaluations = evaluations.exclude(id=exclude_evaluation_id)
            
        return evaluations.aggregate(total=models.Sum('points'))['total'] or 0
        
    def get_max_points_for_group(self, group_size):
        """
        Calculate the maximum total points that can be assigned by a user for a group.
        
        Args:
            group_size: The number of members in the group
            
        Returns:
            int: The maximum total points allowed
        """
        return self.max_points_self * group_size
        
    def get_group_size_for_user(self, user_id):
        """
        Get the size of the group that a user belongs to for this assignment's section.
        
        Args:
            user_id: The user ID
            
        Returns:
            int: The number of members in the user's group
        """
        from src.models import Enrollments
        
        try:
            enrollment = Enrollments.objects.get(
                user_id=user_id,
                section_id=self.section_id
            )
            
            if enrollment.group:
                return Enrollments.objects.filter(group=enrollment.group).count()
            return 0
        except Enrollments.DoesNotExist:
            return 0

class Evaluations(models.Model):
    id = models.AutoField(primary_key=True)
    evaluator_id = models.ForeignKey(Users, on_delete=models.CASCADE, to_field='id', related_name='evaluations_given')
    evaluatee_id = models.ForeignKey(Users, on_delete=models.CASCADE, to_field='id', related_name='evaluations_received')
    assignment_id = models.ForeignKey(Assignments, on_delete=models.CASCADE, to_field='id')
    points = models.IntegerField()
    comments = models.TextField()
    submission_date = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        verbose_name = 'Evaluation'
        verbose_name_plural = 'Evaluations'

    def __str__(self):
        return f"{self.evaluator_id.first_name} {self.evaluator_id.last_name} evaluated {self.evaluatee_id.first_name} {self.evaluatee_id.last_name} for {self.assignment_id.name} in {self.assignment_id.section_id.course.department.id}{self.assignment_id.section_id.course.course_code}-{self.assignment_id.section_id.section_number}"

class MeritScores(models.Model):
    id = models.AutoField(primary_key=True)
    evaluation_id = models.ForeignKey(Evaluations, on_delete=models.CASCADE, to_field='id')
    score_workcontribution = models.IntegerField('Work Contribution', help_text='How much the student contributed to the group work.', validators=[MinValueValidator(1), MaxValueValidator(5)])
    score_teaminteraction = models.IntegerField('Team Interaction', help_text='How much the student interacted with the team.', validators=[MinValueValidator(1), MaxValueValidator(5)])
    score_teamawareness = models.IntegerField('Team Awareness', help_text='How aware the student is of the team.', validators=[MinValueValidator(1), MaxValueValidator(5)])
    score_qualityofwork = models.IntegerField('Quality of Work', help_text='How much the student is committed to the quality of the work.', validators=[MinValueValidator(1), MaxValueValidator(5)])
    score_knowledgeandskills = models.IntegerField('Knowledge and Skills', help_text='How much the student knows about the subject.', validators=[MinValueValidator(1), MaxValueValidator(5)]) 
    
    class Meta:
        verbose_name = 'Merit Score'
        verbose_name_plural = 'Merit Scores'

    def __str__(self):
        return f"{self.evaluation_id.evaluator_id.first_name} {self.evaluation_id.evaluator_id.last_name} scored {self.score_workcontribution} for {self.evaluation_id.evaluatee_id.first_name} {self.evaluation_id.evaluatee_id.last_name} in {self.evaluation_id.assignment_id.name}"

# ==========================================
# NEW SCHEMA MAPPING TO EXISTING TABLES
# ==========================================

class KnowledgeCategory(models.Model):
    categoryName = models.CharField(max_length=100, db_column='categoryname')
    class Level(models.IntegerChoices):
        LOW = 1, 'Low'
        MEDIUM = 2, 'Medium'
        HIGH = 3, 'High'
    knowledgeLevel = models.IntegerField(choices=Level.choices, db_column='knowledgelevel')

    class Meta:
        db_table = 'knowledgecategory'
        verbose_name = 'Knowledge Category'
        verbose_name_plural = 'Knowledge Categories'

    def __str__(self):
        return self.categoryName

class Instructor(models.Model):
    email = models.CharField(max_length=25, primary_key=True) 
    firstName = models.CharField(max_length=45, db_column='firstname')
    lastName = models.CharField(max_length=45, db_column='lastname')

    class Meta:
        db_table = 'instructor'

    def __str__(self):
        return self.email

class Student(models.Model):
    class Degree(models.TextChoices):
        MS = 'MS', 'Master of Science'
        PHD = 'PhD', 'Doctor of Philosophy'

    class Campus(models.TextChoices):
        INDY = 'Indy', 'Indianapolis'
        WL = 'WL', 'West Lafayette'
    
    email = models.CharField(max_length=25, primary_key=True)
    firstName = models.CharField(max_length=45, db_column='firstname')
    lastName = models.CharField(max_length=45, db_column='lastname')
    department = models.CharField(max_length=20)
    degree = models.CharField(max_length=3, choices=Degree.choices)
    resume = models.BinaryField()
    teachingExperienceBool = models.CharField(max_length=45, db_column='teachingexperiencebool')
    teachingExperienceText = models.CharField(max_length=250, db_column='teachingexperiencetext')
    campus = models.CharField(max_length=5, choices=Campus.choices)
    year = models.CharField(max_length=15, blank=True, null=True)

    class Meta:
        db_table = 'student'

    def __str__(self):
        return self.email

class Course(models.Model):
    idcourse = models.CharField(max_length=15, primary_key=True)
    title = models.CharField(max_length=45)
    description = models.CharField(max_length=150)

    class Meta:
        db_table = 'course'

    def __str__(self):
        return self.idcourse

class CourseInstructorYear(models.Model):
    instructor = models.ForeignKey(Instructor, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    year = models.CharField(max_length=15)

    class Meta:
        db_table = 'courseinstructoryear'
        verbose_name = 'Course Instructor Year'
        verbose_name_plural = 'Course Instructor Years'

class CourseMustKnow(models.Model):
    courseID = models.ForeignKey(Course, on_delete=models.CASCADE, db_column='courseid', primary_key=True)
    categoryID = models.ForeignKey(KnowledgeCategory, on_delete=models.CASCADE, db_column='categoryid')

    class Meta:
        db_table = 'coursemustknow'
        verbose_name = 'Course Must Know'
        verbose_name_plural = 'Course Must Knows'

class CourseStudentYearKnowledge(models.Model):
    class KnowledgeLevel(models.IntegerChoices):
        LOW = 1, 'Low'
        MEDIUM = 2, 'Medium'
        HIGH = 3, 'High'
    
    class CourseTaken(models.TextChoices):
        YES = 'Yes', 'Yes'
        NO = 'No', 'No'

    class Recommendation(models.TextChoices):
        STRONGLY_RECOMMEND_PREV = 'Strongly recommend previous TA', 'Strongly recommend previous TA'
        STRONGLY_RECOMMEND = 'Strongly Recommend', 'Strongly Recommend'
        RECOMMEND = 'Recommend', 'Recommend'
        NEUTRAL = 'Neutral', 'Neutral'
        DO_NOT_RECOMMEND = 'Do Not Recommend', 'Do Not Recommend'

    courseID = models.ForeignKey(Course, on_delete=models.CASCADE, db_column='courseid')
    studentID = models.ForeignKey(Student, on_delete=models.CASCADE, db_column='studentid')
    year = models.CharField(max_length=15)
    catID = models.ForeignKey(KnowledgeCategory, on_delete=models.CASCADE, db_column='catid')
    level = models.IntegerField(choices=KnowledgeLevel.choices)
    courseTaken = models.CharField(max_length=3, choices=CourseTaken.choices, db_column='coursetaken')
    knowledgeLevel = models.IntegerField(choices=KnowledgeLevel.choices, db_column='knowledgelevel')
    courseKnowledge = models.TextField(blank=True, default='', db_column='courseknowledge')
    overallRecommendation = models.CharField(max_length=50, choices=Recommendation.choices, blank=True, null=True, db_column='overallrecommendation')
    comments = models.CharField(max_length=250, blank=True, null=True, db_column='comments')


    class Meta:
        db_table = 'coursestudentyearknowledge'
        verbose_name = 'Course Student Year Knowledge'
        verbose_name_plural = 'Course Student Year Knowledges'
        unique_together = ('studentID', 'courseID', 'year', 'catID')

