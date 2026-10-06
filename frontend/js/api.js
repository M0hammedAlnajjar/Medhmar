const API_BASE = window.MEDHMAR_API_URL || `http://${window.location.hostname}:8080`;
let csrf = null;

async function parse(response) {
  if (response.status === 204) return null;
  const type = response.headers.get("content-type") || "";
  return type.includes("application/json") ? response.json() : response.text();
}

export async function refreshCsrf() {
  const response = await fetch(`${API_BASE}/api/auth/csrf`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Unable to obtain CSRF token.");
  csrf = await response.json();
  return csrf;
}

export async function api(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const modifying = !["GET", "HEAD", "OPTIONS"].includes(method);
  const headers = new Headers(options.headers || {});
  if (modifying) {
    if (!csrf) await refreshCsrf();
    headers.set(csrf.headerName, csrf.token);
    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    method,
    headers,
    credentials: "include",
  });
  const data = await parse(response);
  if (!response.ok) {
    const message = data?.message || data?.code || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  if (modifying && ["/api/auth/login", "/api/auth/logout"].includes(path)) {
    csrf = null;
  }
  return data;
}

export const authApi = {
  googleUrl: () => `${API_BASE}/oauth2/authorization/google`,
  login: (payload) => api("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  register: (payload) => api("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  forgot: (email) => api("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  reset: (token, password) => api("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),
  logout: () => api("/api/auth/logout", { method: "POST" }),
  me: () => api("/api/users/me", { cache: "no-store" }),
  updateMe: (payload) => api("/api/users/me", { method: "PUT", body: JSON.stringify(payload) }),
};

export const challengeApi = {
  list: () => api("/api/challenges?page=0&size=20"),
  one: (id) => api(`/api/challenges/${id}`),
  results: (id) => api(`/api/challenges/${id}/results`),
  vote: (id, camelId) => api(`/api/challenges/${id}/votes`, { method: "POST", body: JSON.stringify({ camelId }) }),
};

export const adminApi = {
  users: (page = 0) => api(`/api/admin/users?page=${page}&size=20`, { cache: "no-store" }),
  roles: (id, roles) => api(`/api/admin/users/${id}/roles`, { method: "PUT", body: JSON.stringify({ roles }) }),
  status: (id, status) => api(`/api/admin/users/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
};

export const organizationApi = {
  list: () => api("/api/organizations"),
  one: (id) => api(`/api/organizations/${id}`),
};

export const tourismApi = {
  events: () => api("/api/tourism/events"),
  content: () => api("/api/tourism/content"),
};

export const raceCardApi = {
  latest: (raceId) => api(`/api/race-cards/races/${raceId}/latest`),
  history: (raceId) => api(`/api/race-cards/races/${raceId}`),
  publish: (raceId) => api(`/api/race-cards/races/${raceId}/publish`, { method: "POST" }),
};

export const trainerApi = {
  get: (id = 1) => api(`/trainer-profile/getById?id=${id}`),
};

export const trainingApi = {
  logs: (agreementId) => api(`/api/training-logs/agreement/${agreementId}`),
  add: (payload) => api("/api/training-logs", { method: "POST", body: JSON.stringify(payload) }),
};

export const pedigreeApi = {
  tree: (camelId) => api(`/camel/${camelId}/pedigree/tree`),
};

