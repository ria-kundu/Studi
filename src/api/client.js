import { getValidIdToken } from './auth.js';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = new Headers();

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = await getValidIdToken();
    if (!token) {
      throw new ApiError('Please log in to continue.', 401, null);
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new ApiError(data?.error?.message || 'Request failed.', response.status, data);
  }

  return data;
}

export async function apiFormRequest(path, { method = 'POST', formData, auth = true } = {}) {
  const headers = new Headers();

  if (auth) {
    const token = await getValidIdToken();
    if (!token) {
      throw new ApiError('Please log in to continue.', 401, null);
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: formData,
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new ApiError(data?.error?.message || 'Request failed.', response.status, data);
  }

  return data;
}
