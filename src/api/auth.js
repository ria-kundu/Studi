const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_WEB_API_KEY;
const AUTH_STORAGE_KEY = 'studyspot.auth';
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

function requireFirebaseApiKey() {
  if (!FIREBASE_API_KEY) {
    throw new Error('Firebase web API key is missing. Set VITE_FIREBASE_WEB_API_KEY in your frontend environment.');
  }
}

function authStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readSession() {
  const storage = authStorage();
  if (!storage) return null;

  const raw = storage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    storage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function writeSession(session) {
  const storage = authStorage();
  if (storage) {
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }
}

function friendlyAuthMessage(message) {
  const code = String(message || '').replace(/^Firebase: /, '');

  if (code.includes('EMAIL_EXISTS')) return 'An account with that email already exists.';
  if (code.includes('EMAIL_NOT_FOUND') || code.includes('INVALID_LOGIN_CREDENTIALS')) return 'Email or password is incorrect.';
  if (code.includes('INVALID_PASSWORD')) return 'Email or password is incorrect.';
  if (code.includes('WEAK_PASSWORD')) return 'Password should be at least 6 characters.';
  if (code.includes('INVALID_EMAIL')) return 'Enter a valid email address.';

  return 'Authentication failed. Please try again.';
}

async function firebaseRequest(endpoint, body) {
  requireFirebaseApiKey();

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(friendlyAuthMessage(data?.error?.message));
  }

  return data;
}

async function refreshRequest(refreshToken) {
  requireFirebaseApiKey();

  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(friendlyAuthMessage(data?.error?.message));
  }

  return data;
}

function buildSession(data) {
  const expiresInMs = Number(data.expiresIn || data.expires_in || 3600) * 1000;

  return {
    idToken: data.idToken || data.id_token,
    refreshToken: data.refreshToken || data.refresh_token,
    expiresAt: Date.now() + expiresInMs,
    email: data.email || '',
    localId: data.localId || data.user_id || '',
  };
}

export function getStoredSession() {
  return readSession();
}

export function clearStoredSession() {
  const storage = authStorage();
  if (storage) {
    storage.removeItem(AUTH_STORAGE_KEY);
  }
}

export async function getValidIdToken() {
  const session = readSession();

  if (!session?.idToken || !session?.refreshToken) {
    return null;
  }

  if (session.expiresAt && session.expiresAt - Date.now() > TOKEN_REFRESH_BUFFER_MS) {
    return session.idToken;
  }

  const refreshed = buildSession(await refreshRequest(session.refreshToken));
  const nextSession = {
    ...session,
    ...refreshed,
    email: refreshed.email || session.email,
    localId: refreshed.localId || session.localId,
  };

  writeSession(nextSession);
  return nextSession.idToken;
}

export async function loginWithEmail(email, password) {
  const data = await firebaseRequest('accounts:signInWithPassword', {
    email,
    password,
    returnSecureToken: true,
  });
  const session = buildSession(data);
  writeSession(session);
  return session;
}

export async function signUpWithEmail(email, password) {
  const data = await firebaseRequest('accounts:signUp', {
    email,
    password,
    returnSecureToken: true,
  });
  const session = buildSession(data);
  writeSession(session);
  return session;
}
