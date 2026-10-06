# Medhmar Frontend — Mohammed Scope

This frontend intentionally implements **Mohammed's assigned interfaces only**, based on the team's interface responsibility mapping.

## Included scope

- Landing / Entry Page
- Sign In
- Create Account
- Forgot Password
- Reset Password
- Home / Overview
- Settings / User Profile
- Trainer Profile
- Challenges
- Challenge Detail + Voting
- Training Log
- Admin Dashboard / User access management
- Pedigree section inside Camel Profile
- Race Card publish control
- Organizations UI
- Tourism / Cultural Content UI
- Race Card public view / history

## Excluded teammate-owned standalone UI

This implementation does **not** create the standalone Camel CRUD / Ownership / Marketplace / Offers screens, Race / Race Entry / Race Result screens, or Training Agreement / Assigned Camels / Audit Log screens assigned to other team members.

The home page can summarize cross-module information because Home / Overview is an integration surface assigned to Mohammed.

## Run locally

```bash
npm ci
npm start
```

Open:

```text
http://127.0.0.1:5500/
```

If port 5500 is already in use:

```powershell
$env:FRONTEND_PORT=5501
npm start
```

## Backend integration

The frontend defaults to:

```text
http://localhost:8080
```

It uses the existing Spring Boot APIs for authentication, profile, challenges, training logs, admin users, organizations, tourism, pedigree and digital race cards. Preview data is shown for visual demonstration when the backend is not running.

## Design language

The UI follows one consistent Medhmar visual system:

- warm sand / off-white background
- dark brown brand navigation
- bronze / muted gold accent
- subtle borders and shadows
- rounded cards
- desktop-first responsive layout
- EN / AR direction toggle
- no permanent main sidebar


## Account screens

`/signin`, `/signup`, `/forgot-password` and `/reset-password` follow the supplied
Medhmar account-screen board. The artwork is rendered from the original
`assets/auth-reference.png` using SVG viewports; its source resolution limits
sharpness on large displays. Forms and buttons remain native HTML.

- Registration explicitly requires Fan / Spectator, Camel Owner or Trainer,
  plus matching passwords. Roles are still validated by the backend.
- “Remember me” remembers only the email on this device; session lifetime is
  controlled by Spring Security. No passwords or tokens are stored locally.
- Google buttons use the existing `/oauth2/authorization/google` endpoint,
  which requires backend Google OAuth configuration. Google registration is
  limited to the selected Fan / Spectator role; Owner/Trainer registration
  uses the email/password form.
- Password reset reads the token from the emailed URL's fragment (or query),
  and displays an error if it is missing.
