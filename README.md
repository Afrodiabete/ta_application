# PeerEval 🎓

A comprehensive peer evaluation system built with Django for academic institutions. PeerEval enables instructors to create and manage peer evaluation assignments where students evaluate their teammates' contributions in group projects.

[![Python](https://img.shields.io/badge/Python-3.13.3-blue.svg)](https://python.org)
[![Django](https://img.shields.io/badge/Django-5.2.1-green.svg)](https://djangoproject.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue.svg)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/discord/1323776985423675473?color=7289DA&label=Discord&logo=discord&logoColor=white)](https://discord.gg/Ag9TQfMn4X)

---

### 1. Authentication & Login

| Feature | URL | Description |
|---------|-----|-------------|
| System Home (Login Required) | `/` | Displays Instructor or Student Dashboard based on role |
| Login | `/login/` | **Email** + Password login; redirects to **Dashboard** (`/app/`) upon success |
| Logout | `accounts/logout/` | Logs out and clears session |
| Forgot Password | `/password_reset_request/` | Request password reset |
| Reset Password | `/password_reset/` | Set new password (forced on first login) |
| **Dashboard** (Login Required) | `/app/` | Single Page Application (SPA) for Faculty, Admin, and Students |

- Accessing protected pages without login redirects to `/login/`.
- Post-login redirect defaults to the **Dashboard** (`/app/`).

---

### 2. Django Backend Features (By Role)

#### Instructor

| Feature | Example URL | Description |
|---------|-------------|-------------|
| Dashboard | `/` | Active/Past sections, assignments, evaluation progress, student stats |
| Manage Section | `/manage/<section_id>/` | Overview and actions for a single section |
| Manage Students | `manage/<id>/manage_students/` | Add/Remove students, Import roster |
| Add Assignment | `manage/<id>/add_assignment/` | Create peer evaluation assignments for a section |
| Manage Groups | `manage/<id>/manage_groups/` | Configure group assignments |
| Import Students | `section/<id>/import/` | Bulk import wizard |
| Export Grades | `section/<id>/export/` | Export evaluation results |
| Manage Instructors | `section/<id>/manage-instructors/` | Add/Remove co-instructors |
| View Assignment | `/view/assignment/<id>/` | Assignment details and settings |
| Edit/Delete Assignment | `assignment/<id>/edit/` | Modify assignment parameters |
| Student Profile | `/view/student/<email>/` | View student data and evaluation history |
| Edit/Delete Course | `course/<id>/edit/` | Maintain course data |

#### Student

| Feature | Example URL | Description |
|---------|-------------|-------------|
| **TA Application** | `/app/` | **New**: Apply for TA positions, upload resume, and rate skills |
| Fill Evaluation | `/evaluation/...` | Complete peer/self evaluations (Merit dimensions) |
| Submit Evaluation | `/submit_evaluation/...` | Submit completed evaluations |
| Dashboard | `/` | View pending assignments, deadlines, and completed evaluations |

#### System Admin / Shared

| Feature | URL | Description |
|---------|-----|-------------|
| Add Course | `/add/course/` | Create new courses |
| Add Instructor | `/add/instructor/` | Create instructor accounts |
| Add Section | `/add/section/` | Create class sections for a term |
| Add Assignment | `/add/assignment/` | Create assignments |
| Add Student | `/add/student/` | Add student accounts |
| Add Term | `/add/term/` | Define academic terms |
| Add Department | `/add/department/` | Create departments |

---

### 3. Modular Dashboard (SPA)

The main dashboard at `/app/` has been rebuilt as a **Modular Single Page Application (SPA)** using Django templates and vanilla JavaScript (no complex build step required). 

#### Key Features:
- **Role-Based Controllers**: The monolithic dashboard is split into independent controllers (`admin_controller.js`, `faculty_controller.js`, and `student_controller.js`) that are injected via a thin shell template.
- **Admin View**: Evaluate all pending and evaluated applicants. Download resumes inline via PDF iframes.
- **Faculty View**: View courses, applicants, detailed applicant information, and submit overall performance recommendations directly from the browser.
- **Student TA Application Form**: A multi-step wizard for students to apply for Teaching Assistant positions.
    - **Basic Info**: Collects name, email, and semester.
    - **Academic Background**: Captures degree (MS/PhD), program (CNIT/CGT/CS), campus, and teaching experience.
    - **Resume Upload**: Supports PDF resume uploads handled securely via `FormData`.
- **Dynamic Course Skills**:
    - When a student selects a course to apply for, the system **dynamically fetches** the required skills for that course.
    - Students rate their proficiency (1-5) for each specific skill (e.g., Python, Unity, SQL).
- **Smart Validation**: Prevents submission of incomplete forms and validates data types.

---

### 4. Database & Models

The system is built on **PostgreSQL**. Recent updates gave improved data integrity and model mapping.

-   **Model Mapping**: Explicit `db_column` attributes ensure Django models correctly map to existing database columns (e.g., `firstName` maps to `firstname`).
-   **Pseudo-Primary Keys**: `CourseMustKnow` and `CourseStudentYearKnowledge` tables use `courseID` and `studentID` respectively as primary keys to support Django ORM operations despite missing standard `id` columns in the legacy schema.
-   **Data Constraints**: Frontend modifications ensure data (like Campus codes) fits within database column character limits.

---

### 5. Management Commands & Scripts

| Command | Description |
|---------|-------------|
| `python manage.py createadmin` | Create an admin user (email-based) |
| `python manage.py cleandata` | Clean test data |
| `python manage.py migrate` | Run database migrations |
| `python manage.py collectstatic` | Collect static files |
| `python populate_skills.py` | **New**: Seed the database with test `KnowledgeCategory` and `CourseMustKnow` data for verifying dynamic skills features. |

---

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ItzPabz/PeerEval.git
   cd PeerEval
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Launch with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Create initial admin user**
   ```bash
   docker exec -it peereval-web python manage.py createadmin --email your@email.com --password your_password
   ```

5. **(Optional) Seed Skill Data**
   To test the dynamic skills feature in the TA application:
   ```bash
   docker exec -it peereval-web python populate_skills.py
   ```

6. **Access the application**
   - Application: http://localhost:8000
   - Login: http://localhost:8000/login
   - Student Dashboard: http://localhost:8000/app/

---

## 🔧 Troubleshooting

### Common Issues

**Database `value too long` Error**
- Ensure you are using the latest version of the frontend, which sends short codes (e.g., "WL") instead of full names for Campus and Year.

**`column ... id does not exist` Error**
- This is resolved in the latest `models.py` by using `primary_key=True` on alternative unique columns for `CourseMustKnow` and `CourseStudentYearKnowledge`.

---

**Built with ❤️ for academic institutions worldwide**