# Server

TypeScript Express API for the Studi backend.

This server is responsible for Firebase Authentication verification, Firestore user profile persistence, profile update validation, and backend security middleware. It intentionally does not include frontend UI, ranking/recommendation UI, styling, deployment config, or unrelated app features.

## Tech Stack

- Node.js
- TypeScript
- Express
- Firebase Admin SDK
- Firestore
- Firebase Authentication ID tokens
- Zod validation
- Helmet, CORS, and rate limiting

## Setup

Install dependencies:

```bash
cd server
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Use this shape:

```bash
PORT=3000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
FIREBASE_PROJECT_ID=studi-18616
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=30
```

Download a Firebase Admin SDK service account JSON from Firebase Console and save it as:

```text
server/serviceAccountKey.json
```

Do not commit `.env` or `serviceAccountKey.json`.

For repeated local black-box test runs, you can raise the local-only limits in `.env`:

```bash
RATE_LIMIT_MAX=1000
AUTH_RATE_LIMIT_MAX=1000
```

## Commands

Run in development:

```bash
npm run dev
```

Typecheck:

```bash
npm run typecheck
```

Build:

```bash
npm run build
```

Run compiled server:

```bash
npm start
```

Run black-box API tests:

```bash
npm run test:blackbox
```

## Local URLs

API base URL:

```text
http://localhost:3000/api
```

Health check:

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "backend",
  "environment": "development",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

## Authentication

Protected routes require a Firebase Authentication ID token:

```http
Authorization: Bearer <firebase_id_token>
```

The frontend signs in with Firebase Auth, gets the current user's ID token, and sends it in the `Authorization` header. The backend verifies that token with Firebase Admin SDK.

The backend never trusts `uid` from request bodies, URL params, or query strings. The authenticated user ID always comes from the verified Firebase token.

Passwords are not handled by this server. Firebase Authentication manages password storage, hashing, and credential security.

## API Summary

All routes are under `/api`.

### `GET /api/health`

Public health check.

### `POST /api/auth/session`

Protected.

Creates or updates the Firestore user profile for the authenticated Firebase user.

### `GET /api/auth/me`

Protected.

Returns the authenticated user's Firestore profile. If no profile exists yet, this route creates one from the verified Firebase token and returns `onboardingRequired: true`.

### `POST /api/auth/logout`

Public.

Returns a success message explaining that the client should sign out from Firebase and discard the cached ID token. The server does not delete bearer tokens.

### `GET /api/users/me`

Protected.

Returns the current authenticated user's profile.

### `PATCH /api/users/me`

Protected.

Updates editable profile fields for the current authenticated user.

Allowed fields:

- `displayName`
- `bio`
- `preferredCategories`

Allowed categories:

- `Libraries`
- `Cafes`
- `Outdoors`
- `Other`

Blocked fields include:

- `uid`
- `email`
- `role`
- `createdAt`
- `updatedAt`
- `photoURL`
- Any unknown field

Example:

```bash
curl -X PATCH http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Ada Lovelace",
    "bio": "Likes quiet libraries.",
    "preferredCategories": ["Libraries", "Cafes"]
  }'
```

## Firestore Model

Collection:

```text
users
```

Document path:

```text
users/{uid}
```

Shape:

```ts
{
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  bio: string;
  preferredCategories: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

## Security Notes

- Firebase Admin verifies ID tokens on protected routes.
- `uid` is taken only from the verified token.
- Helmet sets common security-related HTTP headers.
- CORS is restricted to `FRONTEND_ORIGIN`.
- The API uses bearer tokens in the `Authorization` header, not cookies.
- Rate limiting is applied under `/api`.
- Zod validates request bodies.
- Unknown profile fields are rejected.
- User-controlled profile strings are sanitized before storage.
- Firestore access uses fixed collection names and SDK document methods.
- No raw SQL is used.
- No secrets or service account keys are hardcoded in source.

These are course-project-appropriate mitigations, not a claim of production-perfect security.

## Tests

Black-box tests live in:

```text
server/tests/api-blackbox-testing.ts
```

They hit the running API over HTTP and verify auth behavior, user profile persistence, validation, sanitization, and security-oriented cases.

See:

```text
server/tests/README.md
```

GitHub Actions workflow:

```text
.github/workflows/backend-blackbox-tests.yml
```

Required GitHub repository secrets:

```text
FIREBASE_SERVICE_ACCOUNT_JSON
FIREBASE_WEB_API_KEY
FIREBASE_TEST_EMAIL
FIREBASE_TEST_PASSWORD
```
