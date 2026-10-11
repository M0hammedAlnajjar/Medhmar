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
| Frontend | HTML, CSS, JavaScript ES modules; Arabic/English |
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
│   ├── assets/      # shared style and imagery
│   ├── js/          # routing, API client and feature views
│   └── tests/       # API-client and browser checks
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

- JDK 21 (recommended for IntelliJ, Maven and runtime) and Maven.
- Docker Desktop **or** an existing MySQL 8+ installation.
- Git and a modern browser; Postman is optional.

### 1. Clone the repository

```powershell
git clone https://github.com/M0hammedAlnajjar/Medhmar.git
cd Medhmar
```

### 2. Set up local MySQL with Docker (recommended)

From the repository root:

```powershell
Copy-Item .env.example .env
notepad .env
```

Choose a private, non-empty value for `DB_PASSWORD`. The provided template uses
`DB_USERNAME=medhmar` and `DB_URL=jdbc:mysql://127.0.0.1:3307/gulf_racing`.
Port **3307** intentionally avoids conflicting with an existing MySQL on 3306.

```powershell
docker compose up -d mysql
docker compose ps
```

Wait for MySQL to be healthy. The server initializes the `gulf_racing` database
and `medhmar` application user on first run. Flyway creates the tables and seeds
roles at backend startup; **do not** import `database/schema.sql` manually into
a Flyway-managed database.

**Using an installed MySQL instead?** Create `gulf_racing` and configure your
actual MySQL account credentials in `.env`, changing the URL to
`jdbc:mysql://localhost:3306/gulf_racing`. The account must have access to
that database. Spring Boot loads the git-ignored `.env` file automatically.
Shell/IDE environment variables take precedence; do not leave old `DB_*`
values set in IntelliJ.

### 3. Run the backend

```powershell
cd backend
mvn spring-boot:run
```

Or launch `GulfRacingApplication` in IntelliJ. Backend: `http://localhost:8080`.
Hibernate uses `ddl-auto=validate`; **Flyway** manages schema migrations.

If startup reports `Access denied for user 'root'@'localhost'`, the configured
MySQL username, password, or account permissions are invalid. This is a local
database authentication issue, not a Java compilation error. See the
[backend troubleshooting guide](backend/README.md#troubleshooting-mysql-authentication).

### 4. Frontend

The frontend follows the Gulf Racing visual reference and connects to the Spring Boot APIs.

```bash
cd frontend
npm start
```

Open `http://localhost:5500/` with the backend running on `http://localhost:8080`.
Use the same hostname for both. See [frontend/README.md](frontend/README.md) for
page coverage, roles, optional Google/email/AI configuration and verification.

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

The optional AI assistant is implemented at `POST /api/ai/chat`. Enable the `ai`
profile and set `AI_API_KEY` to activate it. It supports Arabic and English,
uses approved guidance and selected public records, and requires login and CSRF.
See [Assistant setup and examples](docs/AI.md).

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
Frontend Syntax + API Client + Browser Tests
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


## Frontend Status

The reference-based HTML/CSS/JavaScript frontend includes the 25 concept screens and supporting create/edit flows. It uses real backend requests, with explicit loading, empty, unavailable and permission states. See [the frontend guide](frontend/README.md) for current API limitations; browser test data is isolated from the application.
