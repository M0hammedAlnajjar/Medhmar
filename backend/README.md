# Medhmar Backend

Spring Boot foundation for Gulf Racing. The application starts in
`com.gulfracing.GulfRacingApplication`, above the module packages so Spring can
discover their components as the team implements them.

## Requirements

- JDK 21 (configure both the IntelliJ Project SDK and Maven runner).
- Maven 3.6.3 or newer.
- A running MySQL database for normal application startup.

The POM uses Spring Boot 4.1.1 and Spring AI 2.0.1. Spring AI 2.0 supports Spring
Boot 4.0 and 4.1. Dependencies use versions managed by the Spring Boot parent and
Spring AI BOM.

## Included dependencies

| Dependency | Purpose |
| --- | --- |
| Spring Web MVC | REST controllers, JSON responses, embedded Tomcat |
| Spring Data JPA | Repositories and Hibernate ORM |
| MySQL Connector/J | MySQL database connections |
| Validation | Request constraints such as `@NotBlank` and `@Valid` |
| Spring Security | Authentication and authorization infrastructure |
| Spring OAuth2 Client | Optional Google OpenID Connect login |
| Spring Mail | Optional SMTP password-reset delivery |
| Flyway + MySQL support | Versioned tables, constraints and role seed data |
| Caffeine | Bounded in-process authentication rate limiter |
| Spring AI OpenAI starter | Optional, read-only Medhmar knowledge assistant |
| Spring Boot Web MVC Test | JUnit, assertions, application context tests, MockMvc |
| Spring Boot Security Test | Security testing support |
| H2 (test scope) | In-memory database used only by automated tests |

## Run locally

1. Create the MySQL database:

   ```sql
   CREATE DATABASE IF NOT EXISTS gulf_racing;
   ```

2. Configure the database credentials. The backend now automatically loads the
   git-ignored `.env` file from the repository root (or from `backend/.env`), so
   the simplest local setup is to copy `.env.example` to `.env` and fill in your
   own MySQL credentials. You can still use terminal or IntelliJ environment
   variables instead. For Windows Command Prompt:

   ```bat
   set "DB_URL=jdbc:mysql://localhost:3306/gulf_racing"
   set "DB_USERNAME=your_mysql_username"
   set "DB_PASSWORD=your_mysql_password"
   ```

   `.env.example` documents the variable names. `.env` is ignored by Git, so do
   not commit passwords or other secrets. Environment variables continue to work
   and take precedence when supplied by the operating system or IDE.
   `AI_API_KEY` is used only when the optional `ai` profile is enabled.

3. From the repository root, run:

   ```bat
   cd backend
   mvn spring-boot:run
   ```

   Alternatively, run `GulfRacingApplication` in IntelliJ after reloading Maven.
   The default port is `8080`; set `PORT` to override it.

The backend now provides local registration/login, roles, profile management,
password reset, optional Google login, challenges and voting. New accounts receive
VIEWER; there is no default administrator or password. Browser authentication uses
an HttpOnly session cookie and CSRF protection. See [API.md](../docs/API.md) for
the endpoint contracts, frontend fetch examples and first-admin setup.

Flyway applies migrations and seeds the five roles before Hibernate performs
`ddl-auto=validate`. Start with an empty database. Migrations are stored under
`src/main/resources/db/migration/{mysql,h2}`. The SQL files under `database/`
are reference copies and should not be run separately against a Flyway database.
For an existing populated database, review its schema before planning a baseline.

Local registration/login and voting need only the database settings. To enable
Google sign-in, configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET and activate
the `google` profile. SMTP password-reset delivery uses the `mail` profile.
For both, set `SPRING_PROFILES_ACTIVE=google,mail`; required variables are
listed in `.env.example` and the API guide.

## Build and test

From `backend`:

```sh
mvn clean verify
```

The tests load the real application context and apply Flyway migrations on H2.
They cover authentication, CSRF, permissions, password resets, Google identity
provisioning, challenge rules and concurrent voting. They require no Google,
SMTP or AI credentials. CI repeats the suite against a disposable MySQL 8.4
service to validate the actual database mappings and constraints. The suite also
checks ownership restrictions on race/camel changes and preserves camel history
when a camel is deleted.

The executable JAR is generated at:

```text
target/medhmar-backend-0.0.1-SNAPSHOT.jar
```

Run it with the same database environment variables:

```sh
java -jar target/medhmar-backend-0.0.1-SNAPSHOT.jar
```

## AI setup

The authenticated assistant API is `POST /api/ai/chat`. It answers in Arabic or
English using a maintained platform guide and optional, explicitly selected
public race/camel fields. It has no write tools or access to private agreements,
offers, account details or training logs.

Enable the `ai` profile and configure `AI_API_KEY`; `AI_MODEL` defaults to
`gpt-4o-mini`. Without that profile the backend starts normally and the assistant
returns `503 AI_NOT_CONFIGURED`. See [AI.md](../docs/AI.md) for IntelliJ setup,
the request contract, CSRF integration, limits and provider behavior.

The AI tests use mocks and a local HTTP provider stub. No real key, external
model call or paid quota is needed for `mvn clean verify` or CI.

## Version references

- [Spring Boot requirements](https://docs.spring.io/spring-boot/system-requirements.html)
- [Spring Boot starters](https://docs.spring.io/spring-boot/reference/using/build-systems.html)
- [Spring AI compatibility and BOM](https://docs.spring.io/spring-ai/reference/getting-started.html)
