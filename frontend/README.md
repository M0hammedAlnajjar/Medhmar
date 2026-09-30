# Medhmar Desktop Web MVP

This is the desktop-first HTML/CSS/JavaScript client for Medhmar's Spring Boot REST backend.
The UI requires no npm installation and intentionally does **not** target mobile layout yet.

## Start locally

1. Start MySQL and the backend from `backend` using `mvn spring-boot:run`.
2. Serve `frontend/` on http://localhost:5500 (for example using VS Code Live Server).
3. Use the same hostname for both services; the client defaults to port 8080 for localhost and 127.0.0.1.
4. If your backend URL differs, set `window.MEDHMAR_API_BASE` before loading `js/app.js` in the HTML files.
5. Backend `FRONTEND_ORIGINS` must include the exact frontend origin. Authentication uses credentials-included HttpOnly session cookies and a CSRF token, refreshed after login/logout.

## Implemented navigation

- Public home, race schedule and race detail, trainer directory, marketplace listings, challenges.
- Local sign in/register/forgot/reset password; optional Google OAuth2 entry point.
- OWNER: add camel, submit race registration, view own entries, propose agreements and inspect offers/listings.
- TRAINER: profile creation/update, agreement decisions, assigned camels, training logs.
- ORGANIZER: create races, view registrations by race, approve/reject, publish results.
- Account profile/preferences and session logout.

The backend validates ownership and role scopes; client-side visibility is a convenience, **not** authorization.
This MVP does not yet include the complete extended dashboards, tourism/recommendation/AI pages, or a mobile version.
