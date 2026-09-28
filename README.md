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

## 👥 Team

| Role | Member |
|---|---|
| Team Leader / Focal Person | Mohammed Al-Najjar |
| Team Members | Jokha Al-Harthi, Suliman Mohammed, Maiyada Albarwani |
| Supervisor | Fatma Al-mamari & Is'haq Al-balushi |

## 📌 Project Status

🚧 In Development — OPAL 3 Program 2026
