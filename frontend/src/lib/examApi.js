/** Separate, minimal API client for the student CBE exam-taking flow.
 *
 * Deliberately NOT the shared `api` client in `./api.js`: that one reads a
 * refresh+access token pair from localStorage for a normal portal login,
 * and the exam session is a completely different thing — a single
 * short-lived, exam-scoped AccessToken (see backend `auth.py`), reached
 * from a public URL a student walks up to in an exam hall, not through the
 * normal login form. Keeping it on sessionStorage under its own key means
 * it can never collide with (or get silently overwritten by) a real
 * portal session already open in the same browser, and it clears itself
 * the moment the tab closes — appropriate for something this short-lived. */

const EXAM_TOKEN_KEY = 'mcss-exam-session-token';
const EXAM_META_KEY = 'mcss-exam-session-meta';

export function getExamToken() {
  return sessionStorage.getItem(EXAM_TOKEN_KEY);
}

export function getExamMeta() {
  try {
    return JSON.parse(sessionStorage.getItem(EXAM_META_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setExamSession(token, meta) {
  sessionStorage.setItem(EXAM_TOKEN_KEY, token);
  if (meta) sessionStorage.setItem(EXAM_META_KEY, JSON.stringify(meta));
}

export function clearExamSession() {
  sessionStorage.removeItem(EXAM_TOKEN_KEY);
  sessionStorage.removeItem(EXAM_META_KEY);
}

export class ExamApiError extends Error {
  constructor(message, { status, errors } = {}) {
    super(message);
    this.name = 'ExamApiError';
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getExamToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`/api/v1${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload = null;
  if (res.status !== 204) {
    try {
      payload = await res.json();
    } catch {
      // no/invalid body
    }
  }

  if (!res.ok || (payload && payload.success === false)) {
    throw new ExamApiError(payload?.message || `Request failed (${res.status})`, {
      status: res.status,
      errors: payload?.errors,
    });
  }

  return payload ? payload.data : null;
}

export const examApi = {
  get: (path) => request(path),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
};
