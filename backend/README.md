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
| Spring AI Chat Client | Provider-independent AI client APIs |
| Spring Boot Web MVC Test | JUnit, assertions, application context tests, MockMvc |
| Spring Boot Security Test | Security testing support |
| H2 (test scope) | In-memory database used only by automated tests |

## Run locally

1. Create the MySQL database:

   ```sql
   CREATE DATABASE IF NOT EXISTS gulf_racing;
   ```

2. Set environment variables in your terminal or IntelliJ run configuration.
   For Windows Command Prompt, replace the sample credentials with your local
   MySQL account:

   ```bat
   set "DB_URL=jdbc:mysql://localhost:3306/gulf_racing"
   set "DB_USERNAME=your_mysql_username"
   set "DB_PASSWORD=your_mysql_password"
   ```

   `.env.example` documents the variable names. Spring Boot does not load a plain
   `.env` file automatically; configure the variables in your terminal or IDE.
   `AI_API_KEY` is not used until an AI model provider is configured.

3. From the repository root, run:

   ```bat
   cd backend
   mvn spring-boot:run
   ```

   Alternatively, run `GulfRacingApplication` in IntelliJ after reloading Maven.
   The default port is `8080`; set `PORT` to override it.

Spring Security currently applies its default development login. Its username
is `user`, and the generated password is printed at startup. Authentication,
roles, and business endpoints still need implementation. A login page or an
HTTP 401 response is expected at this stage.

Hibernate uses `ddl-auto=validate`. Create and update the schema through
`database/schema.sql` as entities are introduced. The database script currently
contains a placeholder, so no domain tables are created by this setup.

## Build and test

From `backend`:

```sh
mvn clean verify
```

The tests load the real application context with an H2 database and check that
anonymous requests to the admin API require authentication. They require no
MySQL account or AI credentials. H2 tests do not validate MySQL-specific SQL;
add MySQL integration tests as database modules are implemented.

The executable JAR is generated at:

```text
target/medhmar-backend-0.0.1-SNAPSHOT.jar
```

Run it with the same database environment variables:

```sh
java -jar target/medhmar-backend-0.0.1-SNAPSHOT.jar
```

## AI setup

The POM includes the provider-independent Chat Client library. When the team
chooses an AI provider, add its Spring AI model starter and configure its model
and credentials. There is no model bean or AI endpoint in this foundation.

## Version references

- [Spring Boot requirements](https://docs.spring.io/spring-boot/system-requirements.html)
- [Spring Boot starters](https://docs.spring.io/spring-boot/reference/using/build-systems.html)
- [Spring AI compatibility and BOM](https://docs.spring.io/spring-ai/reference/getting-started.html)
