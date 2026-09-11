const TOKEN_KEY = 'mcss-access-token';
const REFRESH_KEY = 'mcss-refresh-token';

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  constructor(message, { status, errors } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

let refreshInFlight = null;

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  refreshInFlight ??= (async () => {
    try {
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok || !payload?.success) {
        clearTokens();
        return false;
      }
      setTokens(payload.data);
      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function request(path, { method = 'GET', body, auth = true, retry = true } = {}) {
  // FormData (file uploads) must NOT be JSON-stringified, and must NOT get
  // an explicit Content-Type — the browser sets its own multipart boundary,
  // which a manually-set header would override incorrectly.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`/api/v1${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (res.status === 401 && auth && retry && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request(path, { method, body, auth, retry: false });
  }

  let payload = null;
  if (res.status !== 204) {
    try {
      payload = await res.json();
    } catch {
      // no/invalid body
    }
  }

  if (!res.ok || (payload && payload.success === false)) {
    if (res.status === 503 && payload?.errors?.code === 'maintenance_mode') {
      window.dispatchEvent(new CustomEvent('mcss:maintenance', { detail: { message: payload.message } }));
    }
    throw new ApiError(payload?.message || `Request failed (${res.status})`, {
      status: res.status,
      errors: payload?.errors,
    });
  }

  return payload ? payload.data : null;
}

// For endpoints that return a real file (PDF, CSV, ...) rather than the
// {success, data} JSON envelope — auth still needs the bearer header, so a
// plain <a href> can't be used. Fetches as a blob and triggers the browser's
// normal save flow via a throwaway object URL. Returns the response headers
// (plain object) in case the endpoint reports something alongside the file
// itself — e.g. the payout sheet's X-Payout-* counts, which can't ride in
// the response body since that body *is* the file.
async function downloadFile(path, filename) {
  const token = getAccessToken();
  const res = await fetch(`/api/v1${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let message = `Download failed (${res.status})`;
    try {
      const payload = await res.json();
      message = payload?.message || message;
    } catch {
      // response wasn't JSON (a real file streams past this branch anyway)
    }
    throw new ApiError(message, { status: res.status });
  }
  const headers = Object.fromEntries(res.headers.entries());
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'download';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return headers;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
  download: downloadFile,
};
