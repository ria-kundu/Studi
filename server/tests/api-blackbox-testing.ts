import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import { beforeAll, describe, expect, it } from "vitest";

const TEST_DIR = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(TEST_DIR, ".env.blackbox") });
config({ path: resolve(TEST_DIR, "../.env") });

const BASE_URL = (process.env.API_BASE_URL ?? "http://localhost:3000/api").replace(/\/$/, "");
let VALID_TOKEN = process.env.FIREBASE_ID_TOKEN;
let NO_PROFILE_TOKEN = process.env.FIREBASE_ID_TOKEN_NO_PROFILE;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY;
const FIREBASE_TEST_EMAIL = process.env.FIREBASE_TEST_EMAIL;
const FIREBASE_TEST_PASSWORD = process.env.FIREBASE_TEST_PASSWORD;
const HAS_VALID_TOKEN_SOURCE = Boolean(
  VALID_TOKEN || (FIREBASE_WEB_API_KEY && FIREBASE_TEST_EMAIL && FIREBASE_TEST_PASSWORD),
);
const HAS_FRESH_TOKEN_SOURCE = Boolean(NO_PROFILE_TOKEN || (FIREBASE_WEB_API_KEY && FIREBASE_TEST_PASSWORD));

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

type ApiResult = {
  status: number;
  headers: Headers;
  body: any;
  text: string;
};

type FirebasePasswordSignInResponse = {
  idToken?: string;
  error?: {
    message?: string;
  };
};

type FirebaseSignUpResponse = FirebasePasswordSignInResponse;

async function signUpFirebaseUser(email: string, password: string): Promise<string> {
  if (!FIREBASE_WEB_API_KEY) {
    throw new Error("Missing FIREBASE_WEB_API_KEY env var.");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_WEB_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    },
  );

  const body = (await response.json()) as FirebaseSignUpResponse;

  if (!response.ok || !body.idToken) {
    throw new Error(body.error?.message ?? "Unable to create Firebase test user.");
  }

  return body.idToken;
}

async function api(
  path: string,
  init: RequestInit & { body?: unknown } = {},
): Promise<ApiResult> {
  const headers = new Headers(init.headers ?? {});
  const rawBody = init.body;

  let body: BodyInit | undefined;

  if (rawBody === undefined) {
    body = undefined;
  } else if (typeof rawBody === "string") {
    body = rawBody;
  } else {
    body = JSON.stringify(rawBody);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    body,
  });

  const text = await res.text();

  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  return {
    status: res.status,
    headers: res.headers,
    body: parsed,
    text,
  };
}

function authHeaders(token = VALID_TOKEN): Record<string, string> {
  if (!token) {
    throw new Error("Missing FIREBASE_ID_TOKEN env var.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function getFirebaseIdTokenFromPassword(): Promise<string | undefined> {
  if (!FIREBASE_WEB_API_KEY || !FIREBASE_TEST_EMAIL || !FIREBASE_TEST_PASSWORD) {
    return undefined;
  }

  const signInResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_WEB_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: FIREBASE_TEST_EMAIL,
        password: FIREBASE_TEST_PASSWORD,
        returnSecureToken: true,
      }),
    },
  );

  const signInBody = (await signInResponse.json()) as FirebasePasswordSignInResponse;

  if (signInResponse.ok && signInBody.idToken) {
    return signInBody.idToken;
  }

  try {
    return await signUpFirebaseUser(FIREBASE_TEST_EMAIL, FIREBASE_TEST_PASSWORD);
  } catch (error) {
    const signInMessage = signInBody.error?.message;
    const signUpMessage = error instanceof Error ? error.message : "unknown";
    throw new Error(
      `Unable to sign in or create Firebase test user. Sign-in error: ${
        signInMessage ?? "none"
      }. Sign-up error: ${signUpMessage ?? "none"}.`,
    );
  }
}

async function createFreshFirebaseIdToken(): Promise<string | undefined> {
  if (!FIREBASE_WEB_API_KEY || !FIREBASE_TEST_PASSWORD) {
    return undefined;
  }

  const uniquePart = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const freshEmail = `backend-blackbox-fresh-${uniquePart}@example.com`;
  return signUpFirebaseUser(freshEmail, FIREBASE_TEST_PASSWORD);
}

beforeAll(async () => {
  if (!VALID_TOKEN) {
    VALID_TOKEN = await getFirebaseIdTokenFromPassword();
  }

  if (!NO_PROFILE_TOKEN) {
    NO_PROFILE_TOKEN = await createFreshFirebaseIdToken();
  }
});

function expectError(result: ApiResult, status: number) {
  expect(result.status).toBe(status);
  expect(result.body).toHaveProperty("error");
  expect(result.body.error).toHaveProperty("message");
  expect(result.body.error).toHaveProperty("status", status);
  expect(typeof result.body.error.message).toBe("string");
}

function expectUserShape(user: any) {
  expect(user).toBeTruthy();
  expect(typeof user.uid).toBe("string");
  expect(Array.isArray(user.preferredCategories)).toBe(true);

  expect(user).toHaveProperty("email");
  expect(user).toHaveProperty("displayName");
  expect(user).toHaveProperty("photoURL");
  expect(user).toHaveProperty("bio");
  expect(user).toHaveProperty("createdAt");
  expect(user).toHaveProperty("updatedAt");

  expect(String(user.createdAt)).toMatch(ISO_DATE_RE);
  expect(String(user.updatedAt)).toMatch(ISO_DATE_RE);
}

function expectNoExecutableHtml(value: string) {
  expect(value).not.toMatch(/<script/i);
  expect(value).not.toMatch(/<\/script/i);
  expect(value).not.toMatch(/<img/i);
  expect(value).not.toMatch(/onerror/i);
  expect(value).not.toMatch(/javascript:/i);
}

describe("GET /api/health", () => {
  it("returns 200 with basic service metadata", async () => {
    const res = await api("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("backend");
    expect(typeof res.body.environment).toBe("string");
    expect(res.body.timestamp).toMatch(ISO_DATE_RE);
  });

  it("does not expose obvious secrets", async () => {
    const res = await api("/health");
    const responseText = JSON.stringify(res.body).toLowerCase();

    expect(responseText).not.toContain("private_key");
    expect(responseText).not.toContain("firebase_private_key");
    expect(responseText).not.toContain("client_secret");
    expect(responseText).not.toContain("password");
    expect(responseText).not.toContain("bearer");
  });
});

describe("POST /api/auth/logout", () => {
  it("returns logout guidance", async () => {
    const res = await api("/auth/logout", {
      method: "POST",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(String(res.body.message).toLowerCase()).toContain("firebase");
  });

  it("does not set auth cookies", async () => {
    const res = await api("/auth/logout", {
      method: "POST",
    });

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie.toLowerCase()).not.toMatch(/auth|token|firebase/);
  });
});

describe("protected route authentication checks", () => {
  const protectedRoutes = [
    {
      method: "POST",
      path: "/auth/session",
      body: {},
    },
    {
      method: "GET",
      path: "/auth/me",
    },
    {
      method: "GET",
      path: "/users/me",
    },
    {
      method: "PATCH",
      path: "/users/me",
      body: {
        bio: "test",
      },
    },
    {
      method: "GET",
      path: "/users/example-user",
    },
    {
      method: "GET",
      path: "/users/example-user/rankings",
    },
    {
      method: "GET",
      path: "/rankings/feed",
    },
    {
      method: "POST",
      path: "/rankings",
      body: {
        spotName: "Green Library",
        category: "Libraries",
        quietness: 5,
        restroom: 4,
        wifi: 5,
        outlets: 4,
        crowdness: 2,
        seating: 5,
        hours: "8am - 10pm",
        notes: "Quiet test spot.",
        media: [],
      },
    },
    {
      method: "POST",
      path: "/rankings/example-ranking/comments",
      body: {
        text: "Test comment.",
      },
    },
    {
      method: "GET",
      path: "/spots?q=library",
    },
    {
      method: "GET",
      path: "/spots/example-spot",
    },
    {
      method: "GET",
      path: "/spots/example-spot/rankings",
    },
  ];

  for (const route of protectedRoutes) {
    it(`${route.method} ${route.path} rejects missing Authorization`, async () => {
      const res = await api(route.path, {
        method: route.method,
        body: route.body,
      });

      expectError(res, 401);
    });

    it(`${route.method} ${route.path} rejects non-Bearer Authorization`, async () => {
      const res = await api(route.path, {
        method: route.method,
        headers: {
          Authorization: "Token abc",
        },
        body: route.body,
      });

      expectError(res, 401);
    });

    it(`${route.method} ${route.path} rejects invalid token`, async () => {
      const res = await api(route.path, {
        method: route.method,
        headers: {
          Authorization: "Bearer not-a-real-token",
        },
        body: route.body,
      });

      expectError(res, 401);
    });
  }
});

const describeWithToken = HAS_VALID_TOKEN_SOURCE ? describe : describe.skip;

describeWithToken("POST /api/auth/session", () => {
  it("creates or updates the authenticated user's profile", async () => {
    const res = await api("/auth/session", {
      method: "POST",
      headers: authHeaders(),
    });

    expect(res.status).toBe(200);
    expectUserShape(res.body.user);
  });

  it("ignores fake uid in request body", async () => {
    const first = await api("/auth/session", {
      method: "POST",
      headers: authHeaders(),
    });

    const realUid = first.body.user.uid;

    const second = await api("/auth/session", {
      method: "POST",
      headers: authHeaders(),
      body: {
        uid: "someone-else",
        email: "attacker@example.com",
      },
    });

    expect(second.status).toBe(200);
    expect(second.body.user.uid).toBe(realUid);
    expect(second.body.user.uid).not.toBe("someone-else");
  });

  it("is idempotent for repeated calls", async () => {
    const first = await api("/auth/session", {
      method: "POST",
      headers: authHeaders(),
    });

    const second = await api("/auth/session", {
      method: "POST",
      headers: authHeaders(),
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.user.uid).toBe(first.body.user.uid);
    expect(second.body.user.createdAt).toBe(first.body.user.createdAt);
  });
});

describeWithToken("GET /api/auth/me", () => {
  let expectedUid: string;

  beforeAll(async () => {
    const session = await api("/auth/session", {
      method: "POST",
      headers: authHeaders(),
    });

    expectedUid = session.body.user.uid;
  });

  it("returns the authenticated user's profile when it exists", async () => {
    const res = await api("/auth/me", {
      headers: authHeaders(),
    });

    expect(res.status).toBe(200);
    expectUserShape(res.body.user);
    expect(res.body.user.uid).toBe(expectedUid);
  });
});

const describeWithFreshToken = HAS_FRESH_TOKEN_SOURCE ? describe : describe.skip;

describeWithFreshToken("fresh user behavior", () => {
  it("GET /api/users/me returns 404 before profile exists, then GET /api/auth/me creates it", async () => {
    const before = await api("/users/me", {
      headers: authHeaders(NO_PROFILE_TOKEN),
    });

    expectError(before, 404);

    const created = await api("/auth/me", {
      headers: authHeaders(NO_PROFILE_TOKEN),
    });

    expect(created.status).toBe(201);
    expect(created.body.onboardingRequired).toBe(true);
    expectUserShape(created.body.user);
  });
});

describeWithToken("GET /api/users/me", () => {
  let expectedUid: string;

  beforeAll(async () => {
    const session = await api("/auth/session", {
      method: "POST",
      headers: authHeaders(),
    });

    expectedUid = session.body.user.uid;
  });

  it("returns the current authenticated user's profile", async () => {
    const res = await api("/users/me", {
      headers: authHeaders(),
    });

    expect(res.status).toBe(200);
    expectUserShape(res.body.user);
    expect(res.body.user.uid).toBe(expectedUid);
  });

  it("ignores uid query param and still returns authenticated user's profile", async () => {
    const res = await api("/users/me?uid=someone-else", {
      headers: authHeaders(),
    });

    expect(res.status).toBe(200);
    expect(res.body.user.uid).toBe(expectedUid);
    expect(res.body.user.uid).not.toBe("someone-else");
  });
});

describeWithToken("PATCH /api/users/me", () => {
  let expectedUid: string;

  beforeAll(async () => {
    const session = await api("/auth/session", {
      method: "POST",
      headers: authHeaders(),
    });

    expectedUid = session.body.user.uid;
  });

  it("accepts a valid full update", async () => {
    const res = await api("/users/me", {
      method: "PATCH",
      headers: authHeaders(),
      body: {
        displayName: "Ada Lovelace",
        bio: "Likes quiet libraries.",
        preferredCategories: ["Libraries", "Cafes"],
      },
    });

    expect(res.status).toBe(200);
    expectUserShape(res.body.user);
    expect(res.body.user.uid).toBe(expectedUid);
    expect(res.body.user.displayName).toBe("Ada Lovelace");
    expect(res.body.user.bio).toBe("Likes quiet libraries.");
    expect(res.body.user.preferredCategories).toEqual(["Libraries", "Cafes"]);
  });

  it("accepts a valid partial update", async () => {
    const res = await api("/users/me", {
      method: "PATCH",
      headers: authHeaders(),
      body: {
        bio: "Prefers quiet spots near outlets.",
      },
    });

    expect(res.status).toBe(200);
    expect(res.body.user.uid).toBe(expectedUid);
    expect(res.body.user.bio).toBe("Prefers quiet spots near outlets.");
  });

  it.each([
    ["empty body", {}],
    ["unknown field", { favoriteColor: "blue" }],
    ["blocked uid", { uid: "someone-else" }],
    ["blocked email", { email: "attacker@example.com" }],
    ["blocked role", { role: "admin" }],
    ["blocked createdAt", { createdAt: "2000-01-01T00:00:00.000Z" }],
    ["blocked updatedAt", { updatedAt: "2000-01-01T00:00:00.000Z" }],
    ["blocked photoURL", { photoURL: "https://evil.example/avatar.png" }],
    ["empty displayName", { displayName: "" }],
    ["whitespace-only displayName", { displayName: "     " }],
    ["displayName longer than 80 chars", { displayName: "a".repeat(81) }],
    ["bio longer than 300 chars", { bio: "b".repeat(301) }],
    [
      "more than 4 preferredCategories",
      {
        preferredCategories: ["Libraries", "Cafes", "Outdoors", "Other", "Dorms"],
      },
    ],
    ["invalid preferred category", { preferredCategories: ["Dorms"] }],
    ["preferredCategories not an array", { preferredCategories: "Libraries" }],
  ])("rejects invalid update: %s", async (_name, body) => {
    const res = await api("/users/me", {
      method: "PATCH",
      headers: authHeaders(),
      body,
    });

    expectError(res, 400);
  });

  it("sanitizes executable HTML before storage/return", async () => {
    const res = await api("/users/me", {
      method: "PATCH",
      headers: authHeaders(),
      body: {
        displayName: "<img src=x onerror=alert(1)>Ada",
        bio: "<script>alert(1)</script>Quiet study spots",
      },
    });

    expect(res.status).toBe(200);
    expect(res.body.user.uid).toBe(expectedUid);

    expectNoExecutableHtml(res.body.user.displayName);
    expectNoExecutableHtml(res.body.user.bio);

    expect(res.body.user.displayName).toContain("Ada");
    expect(res.body.user.bio).toContain("Quiet study spots");
  });

  it("treats SQL-like input as plain text and does not crash", async () => {
    const payload = "Robert'); DROP TABLE users;--";

    const res = await api("/users/me", {
      method: "PATCH",
      headers: authHeaders(),
      body: {
        displayName: payload,
      },
    });

    expect(res.status).toBe(200);
    expect(res.body.user.uid).toBe(expectedUid);
    expect(typeof res.body.user.displayName).toBe("string");
    expect(res.body.user.displayName).toContain("Robert");
  });

  it("ignores uid query param and updates only authenticated user", async () => {
    const res = await api("/users/me?uid=someone-else", {
      method: "PATCH",
      headers: authHeaders(),
      body: {
        bio: "Still updating only my own profile.",
      },
    });

    expect(res.status).toBe(200);
    expect(res.body.user.uid).toBe(expectedUid);
    expect(res.body.user.uid).not.toBe("someone-else");
    expect(res.body.user.bio).toBe("Still updating only my own profile.");
  });
});

describe("CSRF/CORS-oriented checks", () => {
  it("protected route fails without Authorization header", async () => {
    const res = await api("/users/me");

    expectError(res, 401);
  });

  it("does not use wildcard CORS for configured frontend origin", async () => {
    const res = await api("/health", {
      headers: {
        Origin: FRONTEND_ORIGIN,
      },
    });

    const allowOrigin = res.headers.get("access-control-allow-origin");

    if (allowOrigin !== null) {
      expect(allowOrigin).not.toBe("*");
    }
  });

  it("does not set auth cookies on profile/session route", async () => {
    if (!VALID_TOKEN) {
      return;
    }

    const res = await api("/auth/session", {
      method: "POST",
      headers: authHeaders(),
    });

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie.toLowerCase()).not.toMatch(/auth|token|firebase/);
  });
});
