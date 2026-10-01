# 🐪 Gulf Racing – Camel Racing Management Platform(Medhmar)

## 🏁 Project Overview

Gulf Racing is a web-based platform designed to connect camel racing organizers, owners, trainers, and spectators in one centralized system.

The platform allows users to discover races, manage camel profiles, submit registrations, view published results, participate in audience voting, and interact with an AI-powered knowledge assistant.

The system is developed using HTML, CSS, JavaScript, Java Spring Boot, MySQL, and Spring AI.

## 🏗️ Architecture Overview

Gulf Racing follows a three-layer architecture:

```text
┌──────────────────────────────┐
│          Frontend            │
│      HTML / CSS / JS         │
└──────────────┬───────────────┘
               │
               │ REST API
               ▼
┌──────────────────────────────┐
│           Backend            │
│        Java + Spring Boot    │
│                              │
│ Controllers                  │
│ Services                     │
│ Repositories                 │
│ Security / Authentication    │
│ Spring AI                    │
└──────────────┬───────────────┘
               │
               │ JPA / Hibernate
               ▼
┌──────────────────────────────┐
│           Database           │
│            MySQL             │
│                              │
│ Users                        │
│ Camels                       │
│ Events / Races               │
│ Registrations                │
│ Results                      │
│ Voting                       │
│ Audit Logs                   │
└──────────────────────────────┘
```

### Main Components

| Component | Responsibility |
|---|---|
| Frontend | User interface, forms, navigation, and API interaction |
| Controllers | Handle HTTP requests and responses |
| Services | Business logic and validation |
| Repositories | Database access using Spring Data JPA |
| Security | Authentication and role-based authorization |
| Spring AI | AI knowledge assistant |
| MySQL | Stores users, camels, races, registrations, results, and votes |

### Main System Flow

```text
User
 ↓
Frontend
 ↓
REST API
 ↓
Controller
 ↓
Service
 ↓
Repository
 ↓
MySQL
```

The AI assistant follows the backend architecture:

```text
User Question
      ↓
Frontend
      ↓
AI REST Endpoint
      ↓
Spring AI
      ↓
Approved Platform Information
      ↓
AI Response
```

## 🧰 Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Java, Spring Boot |
| API | REST API |
| AI | Spring AI |
| Database | MySQL |
| ORM | Spring Data JPA / Hibernate |
| Authentication | Role-Based Access Control |
| Testing | JUnit / Spring Boot Test |
| Version Control | Git & GitHub |

## 📂 Project Structure

```text
Gulf-Racing/
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/gulfracing/
│   │   │   │   ├── controller/
│   │   │   │   ├── service/
│   │   │   │   ├── repository/
│   │   │   │   ├── entity/
│   │   │   │   ├── dto/
│   │   │   │   ├── security/
│   │   │   │   └── ai/
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   │
│   └── pom.xml
│
├── frontend/
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── erd/
│
├── docs/
│   └── API.md
│
└── README.md
```

## 🚀 Setup

### Prerequisites

Install the following:

- Java 17+.
- Maven.
- MySQL 8+.
- Git.
- Modern web browser.
- Postman (optional, for API testing).

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Gulf-Racing
```

### 2. Create the Database

Open MySQL and create the database:

```sql
CREATE DATABASE gulf_racing;
```

Run the database scripts if provided:

```sql
SOURCE database/schema.sql;
SOURCE database/seed.sql;
```

### 3. Configure the Backend

Open:

```text
backend/src/main/resources/application.properties
```

Configure the MySQL connection:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/gulf_racing
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

Configure the required environment variables:

```text
DB_USERNAME=your_username
DB_PASSWORD=your_password
AI_API_KEY=your_api_key
```

Do not commit passwords or API keys to GitHub.

### 4. Run the Backend

```bash
cd backend
mvn spring-boot:run
```

The Spring Boot application will start locally.

### 5. Run the Frontend

Open the frontend folder using a local development server.

For example, using VS Code Live Server, open:

```text
frontend/index.html
```

The frontend communicates with the Spring Boot backend through REST APIs.

## 🧪 Testing

Run backend tests using:

```bash
cd backend
mvn test
```

Tests cover important services such as:

- Authentication and authorization.
- Camel management.
- Race registration.
- Duplicate registration prevention.
- Results management.
- Audience voting.
- AI assistant functionality.

## 📡 API Documentation

The REST API provides endpoints for the main system modules:

```text
/api/auth
/api/users
/api/camels
/api/events
/api/races
/api/registrations
/api/results
/api/polls
/api/ai
```

Detailed API documentation is available in:

```text
docs/API.md
```

## 🔁 CI/CD & Commit Convention

GitHub Actions automatically validates every push and pull request.

### CI Pipeline

```text
Commit / Pull Request
        ↓
Commit Message Check
        ↓
Backend Validate + Test + Build
        ↓
Frontend Structure Check
        ↓
PASS ✅ / FAIL ❌
```

All commit messages must follow this format:

```text
type(scope): description
```

Examples:

```text
feat(camels): add camel management service
fix(auth): handle invalid login credentials
test(races): add race service tests
docs(api): document race endpoints
ci(actions): update CI workflow
```

Allowed commit types:

```text
feat
fix
test
docs
refactor
ci
chore
build
perf
```

If a commit message does not follow the required format, the CI workflow fails.

### CD Pipeline

The CD workflow runs only after CI completes successfully on the `main` branch.

```text
main
 ↓
CI PASS
 ↓
Backend Tests
 ↓
Backend Package
 ↓
Frontend Package
 ↓
GitHub Actions Artifacts
```

Workflow files:

```text
.github/workflows/ci.yml
.github/workflows/cd.yml
```

## 👥 Team

| Role | Member |
|---|---|
| Team Leader / Focal Person | Mohammed Al-Najjar |
| Team Members | Jokha Al-Harthi, Suliman Mohammed, Maiyada Albarwani |
| Supervisor | Fatma Al-mamari & Is'haq Al-balushi |

## 📌 Project Status

🚧 In Development — OPAL 3 Program 2026

| الجزء | الحالة | التفاصيل الحالية |
|---|---|---|
| Authentication | ✅ مكتمل | Register, Login, Logout, Session, CSRF |
| Google Login | ✅ مكتمل | OAuth2 integration موجود |
| Password Reset | ✅ مكتمل | Forgot / Reset Password |
| Roles & Permissions | ✅ مكتمل | `VIEWER`, `OWNER`, `TRAINER`, `ORGANIZER`, `ADMIN` |
| User Profile | ✅ مكتمل | عرض وتعديل بيانات المستخدم |
| Admin User Management | ✅ مكتمل | Users, Roles, Status |
| Camel Management | ✅ مكتمل | Add, Update, View, Soft Delete |
| Camel Profile | ✅ مكتمل | بيانات الهجن |
| Pedigree | ✅ مكتمل | الأب والأم وشجرة النسب |
| Ownership | ✅ مكتمل | سجل الملكية ونسبة الملكية |
| Ownership History | ✅ مكتمل | الاحتفاظ بتاريخ المالكين |
| Marketplace | ✅ مكتمل | عرض الهجن للبيع |
| Offers | ✅ مكتمل | تقديم وتعديل وإلغاء العرض |
| Accept / Decline Offer | ✅ مكتمل | قبول ورفض العروض |
| Ownership Transfer | ✅ مكتمل | تنتقل الملكية عند قبول العرض |
| Race Management | ✅ مكتمل | Create, Update, View, Delete |
| Race Registration | ✅ مكتمل | تسجيل الهجن في السباق |
| Registration Approval | ✅ مكتمل | `PENDING / ACCEPTED / REJECTED / WITHDRAWN` |
| Race Results | ✅ مكتمل | نشر نتائج السباق |
| Trainer Profile | ✅ مكتمل | ملف المدرب |
| Trainer Directory | ✅ مكتمل | عرض المدربين |
| Partnership Agreement | ✅ مكتمل | اتفاقية Owner ↔ Trainer |
| Assigned Camels | ✅ مكتمل | الهجن المسندة للمدرب |
| Training Logs | ✅ مكتمل | تسجيل جلسات التدريب |
| Challenges | ✅ مكتمل | إنشاء وإدارة التحديات |
| Voting | ✅ مكتمل | التصويت بين الهجن |
| Organization System | ✅ مكتمل Backend | Organization + Members + Organization-scoped races |
| Organization Members | ✅ مكتمل | إضافة/إزالة أعضاء وصلاحيات المنظمة |
| Tourism Events | ✅ مكتمل Backend | إنشاء وعرض الفعاليات السياحية |
| Visitor Info | ✅ مكتمل Backend | تسجيل بيانات الزيارات |
| Cultural Content | ✅ مكتمل Backend | محتوى ثقافي + Approval workflow |
| Race Cards | ✅ مكتمل Backend | Digital Race Cards |
| Race Card Entry | ✅ مكتمل | يولد من `ACCEPTED Race Entries` |
| Race Card Versioning | ✅ مكتمل | كل Publish ينشئ Version جديد |
| Flyway Migrations | ✅ مكتمل | MySQL + H2 حتى `V19` |
| Integration Tests | ✅ مكتمل | الأنظمة الجديدة معها Tests |
| Security Integration | ✅ مكتمل | Organization / Tourism / Race Cards داخل Security |
| API Documentation | ✅ محدث | APIs الجديدة موثقة |
| CI | ✅ ناجح | Backend, MySQL, Commit Check, Frontend Check |
| CD | ✅ ناجح | Build Delivery Artifacts |
| Frontend MVP | 🟡 جزئي | الواجهات الأساسية موجودة |
| Organization Frontend | ❌ غير موجود | Backend جاهز لكن UI غير مربوط |
| Tourism Frontend | ❌ غير موجود | Backend جاهز لكن UI غير مربوط |
| Race Cards Frontend | ❌ غير موجود | Backend جاهز لكن UI غير مربوط |
| Full Admin Dashboard | 🟡 جزئي | ليس كاملًا |
| Full Organizer Dashboard | 🟡 جزئي | الوظائف الأساسية موجودة |
| Mobile Responsive UI | ❌ غير موجود | Desktop-first حاليًا |
| AI Assistant | ❌ غير موجود | Spring AI dependency فقط |
| AI Race Insights | ❌ غير موجود | لم يتم تنفيذه |
| Personalized Recommendations | ❌ غير موجود | لم يتم تنفيذه |
| Audit Log | ❌ غير موجود | موجود في ERD فقط |
| Full ERD ↔ Code Sync | 🟡 يحتاج مراجعة | بعض أجزاء الرسم تحتاج تحديث لتطابق الكود الحالي |


## Desktop MVP (frontend integration)

The desktop-first frontend is implemented under `frontend/`; see [frontend/README.md](frontend/README.md)
for local startup, supported screens, environment/CORS settings, login/CSRF behavior and scope.
Run the Spring Boot backend first, then serve `frontend/index.html` at
`http://localhost:5500`. A static HTML file opened via `file://` is not the supported runtime.

The UI currently integrates race registration, trainer profiles, owner–trainer agreements,
assigned camels, training logs, organizer approvals, challenges and marketplace APIs.
Mobile layouts, the extended AI assistant, tourism features and recommendations are later work.
