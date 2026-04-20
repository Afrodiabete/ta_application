# PeerEval 🎓

A comprehensive TA application and peer evaluation system built with Django for academic institutions. PeerEval allows graduate students to apply for Teaching Assistant positions across multiple semesters, while enabling faculty to review applicants for their own courses and administrators to manage all evaluations system-wide.

[![Python](https://img.shields.io/badge/Python-3.13.3-blue.svg)](https://python.org)
[![Django](https://img.shields.io/badge/Django-5.2.1-green.svg)](https://djangoproject.com)
[![MariaDB](https://img.shields.io/badge/MariaDB-10.11-blue.svg)](https://mariadb.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/discord/1323776985423675473?color=7289DA&label=Discord&logo=discord&logoColor=white)](https://discord.gg/Ag9TQfMn4X)

---

## 📋 Table of Contents

- [Features by Role](#features-by-role)
- [Modular Dashboard SPA](#modular-dashboard-spa)
- [Database & Models](#database--models)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Management Commands](#-management-commands)
- [Troubleshooting](#-troubleshooting)

---

## Features by Role

### 1. Authentication & Shared

| Feature | URL | Description |
|---------|-----|-------------|
| Home (Login Required) | `/` | Redirects to the Dashboard |
| **Dashboard SPA** | `/app/` | Role-aware Single Page Application |
| Login | `/login/` | Email + Password; forced password reset on first login |
| Logout | `accounts/logout/` | Clears session |
| Forgot Password | `/password_reset_request/` | Email verification code flow |
| Reset Password | `/password_reset/` | Set new password after code verification |

- Accessing protected pages without login redirects to `/login/`.
- On first login Django forces a password reset before continuing.

---

### 2. Student — TA Application

Students apply for TA positions through a **multi-step application wizard** at `/app/`.

| Step | Description |
|------|-------------|
| **1 · Basic Info** | Name, email, enrollment semester |
| **2 · Academic Background** | Degree (MS/PhD), department (CNIT/CGT/CS/…), campus, teaching experience |
| **3 · Resume Upload** | PDF upload handled via `multipart/form-data` |
| **4 · Course Selection** | Pick one or more courses to apply for |
| **5 · Skill Rating** | Rate proficiency (1–5) for every required skill of the selected course |
| **6 · Course Knowledge** | Free-text description of relevant background |

**Smart behaviours:**
- Selecting a previously applied course **auto-fills** the skill ratings and background text.
- Applied courses are **visually marked** across sessions (persisted via DB).
- Form validation blocks submission of incomplete steps.

---

### 3. Faculty — Applicant Review

Faculty access `/app/` and see only the courses they are assigned to teach via `CourseInstructorYear`.

| Feature | Description |
|---------|-------------|
| Course selection | Dropdown restricted to the instructor's own courses |
| Applicant list | One row per *(applicant × semester)*; shows Term, Department, Teaching Exp, Status |
| Detail view | Academic info, **course-specific skill ratings**, course knowledge text, resume PDF |
| Evaluation | Submit overall recommendation + free-text comments |

> **Note**: Superusers (`is_superuser = True`) using the Admin role see all courses, while regular staff (`is_staff = True`) in the Faculty role see only their assigned courses.

---

### 4. Administrator — System-Wide Review

Administrators access `/app/` and can review applicants across all courses.

| Feature | Description |
|---------|-------------|
| Course + Semester filter | Select course, enter year (4-digit), choose Spring/Fall |
| Pending applicants | View unevaluated applicants with expandable detail rows |
| Evaluated applicants | Filter by recommendation tier (Previous TA, Strongly Rec, Rec, Neutral, Not Rec) |
| Detail rows | Name, email, dept, degree, experience, resume PDF, **other course evaluations with semester labels** |

---

## Modular Dashboard SPA

The dashboard at `/app/` is a **vanilla JavaScript Single Page Application** rendered by Django templates, with no frontend build step.

### Architecture

```
dashboard.html          ← thin shell; injects Django data as window globals
│
├── window.COURSES      ← list of courses (filtered per role)
├── window.COURSE_SKILLS← map of courseId → [{id, name}] required skills
├── window.APPLICANTS   ← list of students + applications
│   └── applications    ← keyed as "courseId__year"  (e.g. "CGT 26505__2026-FA")
│       └── skills[]    ← per-course skill ratings for that semester
│
├── admin_controller.js
├── faculty_controller.js
├── student_controller.js
├── utils.js
└── app.js              ← bootstraps the correct controller based on USER_ROLE
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Composite application key `courseId__year` | Same student can apply to the same course in multiple semesters (e.g., 2026-SP **and** 2026-FA); naïve `courseId` keys caused FA entries to be dropped |
| Skills stored **inside** each application record | `subjectTopics` on the applicant is a flat cross-course list; embedding a `skills[]` array per application record allows the detail view to show only the skills relevant to the selected course |
| Faculty course filtering on the server | `CourseInstructorYear` is queried by `request.user.email` in Python; the filtered `COURSES` list is injected into the page, so the faculty dropdown never exposes unauthorised courses |

---

## Database & Models

The system uses **MariaDB 10.11** (not PostgreSQL). Django connects via `mysqlclient`.

### TA Application Schema (legacy tables)

| Model | DB Table | Purpose |
|-------|----------|---------|
| `Student` | `student` | Applicant profile (degree, campus, resume blob) |
| `Course` | `course` | Course catalogue |
| `Instructor` | `instructor` | Faculty member (email PK) |
| `CourseInstructorYear` | `courseinstructoryear` | Faculty ↔ Course assignment per year |
| `KnowledgeCategory` | `knowledgecategory` | Skill categories (e.g., "Unreal Engine") |
| `CourseMustKnow` | `coursemustknow` | Required skills per course |
| `CourseStudentYearKnowledge` | `coursestudentyearknowledge` | Student's self-rated skill per course per year (also stores evaluation result) |

### Django Auth Schema

| Model | Purpose |
|-------|---------|
| `Users` (extends `AbstractUser`) | Email-based login; `is_staff` = faculty, `is_superuser` = admin |
| `SectionInstructors` | Maps Django `Users` → `Sections` (PeerEval side) |

### Important Model Notes

- `db_column` attributes map camelCase Django fields to lowercase DB columns (e.g., `firstName` → `firstname`).
- `CourseMustKnow` uses `courseID` as `primary_key=True` (no standard `id` column in the legacy table).
- `CourseStudentYearKnowledge` has a composite unique constraint on `(studentID, courseID, year, catID)`.

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
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
   # Edit .env — at minimum set POSTGRES_PASSWORD and SECRET_KEY
   ```

3. **Launch with Docker Compose**
   ```bash
   docker-compose up -d
   ```
   The web service binds to **port 80** on the host (`http://localhost`).
   MariaDB is also accessible at **port 3307** for external clients.

4. **Create the initial admin user**
   ```bash
   docker exec -it ta_application-web python manage.py createadmin \
     --email your@email.com --password your_password
   ```

5. **(Optional) Seed skill and course data**
   ```bash
   # Seed KnowledgeCategory + CourseMustKnow test data
   docker exec -it ta_application-web python populate_skills.py

   # Seed Course catalogue
   docker exec -it ta_application-web python populate_courses.py
   ```

6. **Assign a faculty member to a course**
   To allow a faculty user to see courses in their dashboard, add a row to `CourseInstructorYear` with the instructor's email (matching the `Instructor.email` PK) and the desired `Course.idcourse`.

7. **Access the application**
   - Application: http://localhost
   - Login: http://localhost/login/

---

## 🔧 Environment Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `ta_application` | MariaDB database name |
| `POSTGRES_USER` | `ta_application_admin` | MariaDB user |
| `POSTGRES_PASSWORD` | `P4ssword` | MariaDB password |
| `DB_HOST` | `db` | DB hostname (Docker service name) |
| `DB_PORT` | `3306` | DB port inside Docker network |
| `SECRET_KEY` | `django-insecure-…` | Django secret key — **change in production** |
| `DEBUG` | `True` | Set to `False` for production |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated allowed hostnames |
| `INST_NAME` | `Purdue University` | Displayed in emails and UI |
| `INST_SHORT_NAME` | `Purdue` | Short name used in page titles |
| `TIME_ZONE` | `America/Indiana/Indianapolis` | Django timezone |
| `VM_IP` | *(optional)* | VM IP added to `ALLOWED_HOSTS` automatically |
| `AUTO_UPDATE` | `false` | If `true`, container pulls from `main` every hour |
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP server for password-reset emails |
| `EMAIL_HOST_USER` | `you@gmail.com` | SMTP sender address |
| `EMAIL_HOST_PASSWORD` | `app-password` | SMTP credential |

---

## 🛠 Management Commands

| Command | Description |
|---------|-------------|
| `python manage.py createadmin --email E --password P` | Create a superuser (admin) account |
| `python manage.py cleandata` | Remove test/seed data |
| `python manage.py migrate` | Apply database migrations |
| `python manage.py collectstatic` | Collect static files for production |
| `python populate_skills.py` | Seed `KnowledgeCategory` + `CourseMustKnow` records |
| `python populate_courses.py` | Seed `Course` records |

---

## 🔧 Troubleshooting

### Faculty sees no courses
Ensure a row exists in `CourseInstructorYear` where `instructor_id` matches the faculty user's email exactly (case-sensitive). The faculty user must also have `is_staff = True` on their `Users` record.

### Faculty sees all courses instead of their own
Confirm the user is `is_staff = True` but **not** `is_superuser = True`. Superusers always receive the full course list (Admin role).

### Database `value too long` error
Frontend sends short codes (`WL`, `Indy`) for campus and semester. Ensure you are using the latest version of `student_controller.js`.

### `column … id does not exist` error
Resolved in the current `models.py` by using `primary_key=True` on `CourseMustKnow.courseID`. Run `python manage.py migrate` after pulling updates.

### 2026-FA applicants missing from Faculty / Admin views
This was caused by a naive `courseId`-only key in the applications dict that silently discarded duplicate-course entries from a second semester. Resolved by the composite `courseId__year` key introduced in this version.

---

**Built with ❤️ for academic institutions worldwide**