# Accounts, Access, Challenges and Voting API

Base URL for local development: `http://localhost:8080`.
JSON uses UTF-8 and ISO-8601 UTC timestamps, for example `2030-01-01T10:00:00Z`.

## Authentication contract

Authentication uses an HttpOnly session cookie. Every modifying request, including
registration, login, logout and password reset, requires a CSRF token.

1. `GET /api/auth/csrf` with `credentials: "include"`.
2. Read `headerName` and `token` from the response.
3. Send that header with subsequent POST, PUT, PATCH and DELETE requests.
4. After login or logout, fetch a fresh CSRF token. Login changes the session ID
   and invalidates the previous CSRF token.
5. Keep `credentials: "include"` on authenticated requests.

Example for the frontend:

```javascript
const api = "http://localhost:8080";
let csrf;

async function refreshCsrf() {
  const response = await fetch(api + "/api/auth/csrf", {
    credentials: "include"
  });
  if (!response.ok) throw new Error("Could not obtain a CSRF token.");
  csrf = await response.json();
}

async function send(path, method, body) {
  if (!csrf) await refreshCsrf();
  return fetch(api + path, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      [csrf.headerName]: csrf.token
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

await refreshCsrf();
const response = await send("/api/auth/login", "POST", {
  email: "your-registered-email@example.com",
  password: "your-password"
});
if (response.ok) await refreshCsrf();
```

Use the same hostname for the frontend and backend in local development (for
example localhost on different ports). Configure `FRONTEND_ORIGINS` as a
comma-separated list of exact origins. Production requires HTTPS and
`SESSION_COOKIE_SECURE=true`. Sessions expire after 30 minutes of inactivity.

## Accounts and access

| Method | Endpoint | Access | Request / behavior |
| --- | --- | --- | --- |
| GET | /api/auth/csrf | Public | Returns headerName and token |
| POST | /api/auth/register | Public + CSRF | fullName, email, password, optional preferredLanguage |
| POST | /api/auth/login | Public + CSRF | email, password; starts a session |
| POST | /api/auth/logout | Session + CSRF | Invalidates session; returns 204 |
| POST | /api/auth/forgot-password | Public + CSRF | email; always the same account-neutral response |
| POST | /api/auth/reset-password | Public + CSRF | token, password |
| GET | /api/users/me | Signed in | Current user's profile and role names |
| PUT | /api/users/me | Signed in + CSRF | fullName, preferredLanguage, optional avatarUrl |
| GET | /api/admin/users?page=0&size=20 | ADMIN | Paginated users; maximum size 100 |
| PUT | /api/admin/users/{id}/roles | ADMIN + CSRF | roles: nonempty array of role names |
| PUT | /api/admin/users/{id}/status | ADMIN + CSRF | status: ACTIVE, INACTIVE or SUSPENDED |

Passwords require at least 12 characters and at most 72 UTF-8 bytes, and are
stored with BCrypt. Registration normalizes email case and grants only VIEWER.
The other supported roles are OWNER, TRAINER, ORGANIZER and ADMIN. Client-supplied
role, user ID or account-status fields cannot grant privileges.

Role/status changes and successful password resets invalidate existing sessions
on their next request. Profile updates cannot change email, roles or status.
A separate authenticated account-linking/email-change flow is not included.

The in-process limiter allows 20 login attempts and 5 attempts per other public
authentication action per IP per 15 minutes. Password reset emails also have a
3-minute per-account cooldown. The limiter does not trust X-Forwarded-For.
For multiple application instances, replace it with a shared limiter at the
trusted gateway or a shared backing store.

### First administrator

No default admin account or password is created. Register the intended account,
then a trusted database operator can run the following against that account:

```sql
START TRANSACTION;
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.user_id, r.role_id
FROM users u CROSS JOIN roles r
WHERE u.email = 'your-registered-email@example.com' AND r.role_name = 'ADMIN';

UPDATE users
SET security_version = security_version + 1, row_version = row_version + 1
WHERE email = 'your-registered-email@example.com';
COMMIT;
```

Sign in again after the change. Later role changes should use the admin API.

### Google sign-in

Enable the `google` Spring profile and set `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET` and `OAUTH_SUCCESS_URL`. In the Google OAuth web client,
register the backend callback:

```text
http://localhost:8080/login/oauth2/code/google
```

Navigate the browser to `/oauth2/authorization/google`. Spring Security handles
the authorization-code flow and validates the ID token. The application requires
a verified Google email, identifies accounts by the stable Google subject, and
grants VIEWER to new accounts. It does not silently link accounts by email:
a matching existing local email is rejected. Suspended accounts cannot sign in.

Without the google profile and client credentials, local login still works.
The automated tests cover identity provisioning and collision rules; a real
Google handshake requires the configured OAuth client.

### Password-reset email

Enable the `mail` profile and configure `SMTP_HOST`, `SMTP_PORT`,
`SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_FROM` and `PASSWORD_RESET_URL`.
SMTP uses authentication and required STARTTLS. The reset URL must be the
frontend reset page, for example
`http://localhost:5500/reset-password.html` during local development.

The email contains a 32-byte random token in the URL fragment (`#token=...`).
The frontend reads the fragment and submits the token and new password to the
reset API. The token is never returned from the forgot-password API or logged.
Only its SHA-256 hash is stored. Tokens expire after 30 minutes and are single
use; issuing a new token revokes previous unused tokens.

Email delivery is asynchronous after the database transaction commits. If
delivery fails, the API still does not disclose whether the account exists.
The current in-process delivery has no durable retry queue; failed deliveries
are logged without email addresses or tokens, and the user can retry after the
cooldown. Unconfigured SMTP returns 503 for all reset-email requests.

## Challenges and voting

Any active signed-in user can create a challenge. Only its creator or ADMIN can
edit it, manage its camel entries, open it or close it. Voting requires an active
signed-in account. Public callers can view published challenges and results.

| Method | Endpoint | Request / behavior |
| --- | --- | --- |
| GET | /api/challenges?page=0&size=20 | Published challenges; maximum size 100 |
| GET | /api/challenges/mine | Current user's challenges, including drafts |
| GET | /api/challenges/{id} | Drafts are visible only to their creator or ADMIN |
| GET | /api/challenges/{id}/results | Same challenge response, including vote counts/percentages |
| POST | /api/challenges | title, opensAt, closesAt; creates DRAFT |
| PUT | /api/challenges/{id} | title, opensAt, closesAt; draft only |
| PUT | /api/challenges/{id}/camels/{camelId} | Adds an existing camel to a draft; repeating the same entry is idempotent |
| DELETE | /api/challenges/{id}/camels/{camelId} | Removes a draft's entry |
| POST | /api/challenges/{id}/open | Requires exactly two different camels |
| POST | /api/challenges/{id}/close | Closes an open challenge |
| POST | /api/challenges/{id}/votes | camelId; user identity comes from the session |

Example creation:

```json
{
  "title": "Weekend Camel Challenge",
  "opensAt": "2030-01-01T10:00:00Z",
  "closesAt": "2030-01-01T12:00:00Z"
}
```

Choose actual future dates when running the example. Closing must be after
opening and in the future. An OPEN challenge accepts votes only when
`opensAt <= now < closesAt`. Opening it before opensAt schedules the voting
window. Responses show CLOSED once its deadline passes; expired OPEN rows do
not accept votes even if their stored status has not been changed.

A challenge has at most two camel entries. Entries cannot change after opening.
Camel CRUD is maintained by the camel module; create camels there before adding
them to challenges. Camels marked inactive cannot be added. There is no demo
camel data inserted into production.

Each user has at most one vote per challenge. Challenge row locks serialize
voting and closing, the database has a unique user/challenge constraint, and
the composite foreign key ensures the selected camel belongs to that challenge.
A vote cannot be switched. Counts and percentages are calculated from saved votes,
rounded to two decimal places; zero votes yields 0.00%.

## Integration with the race module

Race reads remain public. Race mutations require ORGANIZER or ADMIN.
An organizer can create races only under their own organizer ID, and can modify
or delete only races they own. ADMIN can manage all races. The existing race DTO
still requires organizerId for create/update requests.

## Integration with the camel module

Camel reads (`GET /camel/getAll` and `GET /camel/getById?id=...`) are public.
Creating, updating and deleting camels requires OWNER or ADMIN and a CSRF token.
`POST /camel/add` also creates a 100% ownership record for the signed-in user;
the client cannot choose a different owner. `PUT /camel/update` and
`DELETE /camel/deleteById?id=...` require a current, positive ownership share
unless the caller is ADMIN. Existing camels need accurate ownership records
before an owner can manage them.

Camel deletion marks the row inactive, preserving ownership and voting history.
Existing challenge entries and results remain available. Gender is MALE or FEMALE;
camel status is ACTIVE, INACTIVE, RETIRED or SOLD. The existing camel request
fields and response shapes remain unchanged.

Other module endpoints are denied until their access rules are explicitly added
to SecurityConfig. This keeps new controllers from becoming writable merely
because a caller has registered an account. The teammate marketplace module is
preserved, with schema support for its tracking fields; its routes remain denied
until that module connects listings to authenticated ownership.

## Errors

Errors are JSON objects with timestamp, status, code, message and errors.
Validation errors contain field messages. HTTP statuses include:

| Status | Meaning |
| --- | --- |
| 400 | Invalid request, invalid/expired/used reset token, or camel not entered |
| 401 | Missing/expired session or invalid credentials |
| 403 | Insufficient permission or missing/invalid CSRF token |
| 404 | Resource not found or private draft not visible |
| 409 | Duplicate data, repeated vote, invalid challenge transition, or concurrent update |
| 429 | Authentication rate limit reached; Retry-After is returned |
| 503 | Password-reset email delivery is not configured |

Password hashes, raw reset tokens and SQL exception details are never returned
by these endpoints.

## Database and verification

Flyway creates tables and role seed rows before Hibernate validates mappings.
MySQL and H2 migrations are under
`backend/src/main/resources/db/migration/{mysql,h2}`.
`database/schema.sql` and `database/seed-data.sql` are MySQL reference copies;
do not run them separately against a Flyway-managed database.

Start with an empty database. Existing populated databases require a reviewed
baseline/migration plan; baseline-on-migrate and automatic destructive changes
are not enabled. Add new migrations for later teammate entity changes instead
of editing migrations already applied.

`mvn clean verify` runs the suite on H2. CI also runs the same suite on MySQL 8.4.
To run against a disposable local MySQL database, set TEST_DB_URL,
TEST_DB_DRIVER=com.mysql.cj.jdbc.Driver, TEST_DB_USERNAME and TEST_DB_PASSWORD.
The integration suite deletes test data; never point TEST_DB_URL at a real
application database.

Coverage includes registration, password hashing, CSRF/session rotation,
logout, roles/status/session revocation, private drafts, challenge ownership,
entry limits, voting time boundaries, cross-challenge membership, percentages,
duplicate/concurrent votes, expired/reused/concurrent reset tokens, Google
identity rules, rate limiting, race/camel ownership authorization, and migration
validation, including camel tracking fields.


## Race registration and approval

Race entry mutations require a valid session and CSRF token. The server controls identity, registration time,
participant number, and initial status. `OPEN` races accept owner registrations only before `startsAt`.
The camel must be active, and the submitting user must have a current positive ownership share.
The same camel cannot be registered twice in one race, including after withdrawal. Participant numbers
are unique within a race and generated under a race-row lock; MySQL and H2 enforce both constraints.

| Method | Endpoint | Permission | Request or result |
| --- | --- | --- | --- |
| POST | /api/race-entries | OWNER or ADMIN | `raceId`, `camelId`, optional matching `registrantId`; creates PENDING |
| GET | /api/race-entries/mine | Signed-in account | Own registrations |
| GET | /api/race-entries/race/{raceId} | Race organizer or ADMIN | Registrations for the race |
| GET | /api/race-entries/{id} | Registrant, race organizer or ADMIN | Single entry |
| GET | /api/race-entries | ADMIN | All registrations |
| PUT | /api/race-entries/{id} | Race organizer or ADMIN | `{"entryStatus":"ACCEPTED"}` or `{"entryStatus":"REJECTED"}` |
| DELETE | /api/race-entries/{id} | OWNER or ADMIN, **registrant only** | Withdraw own PENDING entry; returns 204, retains history |

An organizer decision requires a PENDING entry, before the race starts, and a race that is OPEN or CLOSED.
An entry cannot be reapproved, withdrawn after a decision, or deleted physically through this API.
Sending a different `registrantId` than the authenticated account returns 403. Race-result creation
requires an ACCEPTED entry. For a race organiser, update the race's status through the race API.
