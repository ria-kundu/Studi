# API Black-Box Tests

These tests hit the running backend over HTTP. They do not import Express internals or Firestore services.

Test file:

```text
tests/api-blackbox-testing.ts
```

## What They Cover

- `GET /api/health`
- `POST /api/auth/logout`
- Missing, malformed, and invalid bearer tokens
- `POST /api/auth/session`
- `GET /api/auth/me`
- `GET /api/users/me`
- `PATCH /api/users/me`
- Unknown-field and blocked-field validation
- Preferred category validation
- XSS sanitization checks
- SQL-like plain-text input checks
- Fake UID body/query checks
- CORS/CSRF-oriented behavior checks

## Setup

Start the backend in one terminal:

```bash
cd server
npm run dev
```

In another terminal, create a local black-box test env file:

```bash
cd server
cp tests/.env.blackbox.example tests/.env.blackbox
```

Fill in at least one of these options.

Option 1: paste a current Firebase ID token:

```bash
FIREBASE_ID_TOKEN=your-valid-firebase-id-token
```

Option 2: let the test runner sign in with or create a Firebase Auth test user:

```bash
FIREBASE_WEB_API_KEY=your-firebase-web-api-key
FIREBASE_TEST_EMAIL=test-user@example.com
FIREBASE_TEST_PASSWORD=test-user-password
```

The token or test user must belong to the `studi-18616` Firebase project.

For Option 2, Firebase Authentication must have Email/Password sign-in enabled. The test runner first tries to sign in. If the account does not exist, it creates it through Firebase Auth's public REST API. Use a dedicated test account because the tests will create/update that user's Firestore profile.

The fresh-user onboarding test creates a unique Firebase Auth account during the test run so it can verify the first-time profile creation flow.

## Getting a Firebase ID Token

If using Option 1, use the frontend Firebase client SDK after signing in:

```ts
const token = await auth.currentUser?.getIdToken();
console.log(token);
```

## Run

Run all black-box tests:

```bash
npm run test:blackbox
```

Watch mode:

```bash
npm run test:blackbox:watch
```

You can pass environment variables inline instead of using a file:

```bash
API_BASE_URL=http://localhost:3000/api FIREBASE_ID_TOKEN=your-token npm run test:blackbox
```

## Optional Tests

If no Firebase web API key/password source is available, the fresh-user test is skipped unless you provide:

- `FIREBASE_ID_TOKEN_NO_PROFILE`: enables the fresh-user onboarding test.

## GitHub Actions

The repository includes a workflow at:

```text
.github/workflows/backend-blackbox-tests.yml
```

Add these repository secrets in GitHub before enabling it:

```text
FIREBASE_SERVICE_ACCOUNT_JSON
FIREBASE_WEB_API_KEY
FIREBASE_TEST_EMAIL
FIREBASE_TEST_PASSWORD
```

`FIREBASE_SERVICE_ACCOUNT_JSON` should be the full Firebase Admin service account JSON contents. Do not commit that JSON file.

The workflow installs dependencies, writes the service account JSON to a temporary local file, typechecks, builds, starts the backend, waits for `/api/health`, and runs `npm run test:blackbox`.

## Expected State Changes

These tests intentionally create/update the Firestore profile for the Firebase user represented by `FIREBASE_ID_TOKEN`.

Use a dedicated Firebase test account so the profile data can be overwritten safely.
