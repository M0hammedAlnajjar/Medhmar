import { buildQuery } from "./format.js";

const API_BASE = window.MEDHMAR_API_URL || `http://${window.location.hostname}:8080`;
let csrf = null;

async function fetchBackend(path, options = {}) {
  try {
    return await fetch(`${API_BASE}${path}`, options);
  } catch (cause) {
    const error = new Error(`Backend is not reachable at ${API_BASE}. Start the Spring Boot backend and verify MySQL is running.`);
    error.status = 0;
    error.code = "BACKEND_UNREACHABLE";
    error.cause = cause;
    throw error;
  }
}

async function parse(response) {
  if (response.status === 204) return null;
  const type = response.headers.get("content-type") || "";
  return type.includes("application/json") ? response.json() : response.text();
}

export async function refreshCsrf() {
  const response = await fetchBackend("/api/auth/csrf", {
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
  const response = await fetchBackend(path, {
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
  login: (payload) => api("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  register: (payload) => api("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  forgot: (email) => api("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  reset: (token, password) => api("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),
  logout: () => api("/api/auth/logout", { method: "POST" }),
  me: () => api("/api/users/me"),
  updateMe: (payload) => api("/api/users/me", { method: "PUT", body: JSON.stringify(payload) }),
  googleUrl: () => `${API_BASE}/oauth2/authorization/google`,
};

export const challengeApi = {
  list: () => api("/api/challenges?page=0&size=20"),
  one: (id) => api(`/api/challenges/${id}`),
  results: (id) => api(`/api/challenges/${id}/results`),
  vote: (id, camelId) => api(`/api/challenges/${id}/votes`, { method: "POST", body: JSON.stringify({ camelId }) }),
};

export const adminApi = {
  users: () => api("/api/admin/users?page=0&size=20"),
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

export const agreementApi = {
  list: () => api("/api/agreements"),
  mine: () => api("/api/agreements/mine"),
  one: (id) => api(`/api/agreements/${encodeURIComponent(id)}`),
  add: (payload) => api("/api/agreements", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => api(`/api/agreements/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(payload) }),
  accept: (id) => api(`/api/agreements/${encodeURIComponent(id)}/accept`, { method: "POST" }),
};

export const auditLogApi = {
  list: () => api("/audit-log/getAll"),
  one: (id) => api(`/audit-log/getById?id=${encodeURIComponent(id)}`),
  add: (payload) => api("/audit-log/add", { method: "POST", body: JSON.stringify(payload) }),
  update: (payload) => api("/audit-log/update", { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id) => api(`/audit-log/deleteById?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
};

export const pedigreeApi = {
  tree: (camelId) => api(`/camel/${encodeURIComponent(camelId)}/pedigree/tree?generations=3`),
};

// Camel / Ownership / Marketplace / Offer endpoints (verified against CamelController, MarketPlaceController, OfferController).
// Ownership has no public write endpoint (/ownershipRecord/** is ADMIN-only); history is read through the camel API.
// SaleTransaction has no REST endpoint: it is created server-side by POST /offer/{id}/accept.
export const camelApi = {
  list: (params) => api(`/camel/getAll${buildQuery(params)}`),
  one: (id) => api(`/camel/getById?id=${encodeURIComponent(id)}`),
  profile: (id) => api(`/camel/profile?id=${encodeURIComponent(id)}`),
  mine: () => api("/camel/my-camels"),
  ownership: (id) => api(`/camel/ownership-history?id=${encodeURIComponent(id)}`),
  add: (payload) => api("/camel/add", { method: "POST", body: JSON.stringify(payload) }),
  update: (payload) => api("/camel/update", { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id) => api(`/camel/deleteById?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
};

export const marketplaceApi = {
  list: (params) => api(`/marketplace/getAll${buildQuery(params)}`),
  one: (id) => api(`/marketplace/getById?id=${encodeURIComponent(id)}`),
  mine: () => api("/marketplace/my-listings"),
  history: () => api("/marketplace/history"),
  add: (payload) => api("/marketplace/add", { method: "POST", body: JSON.stringify(payload) }),
  update: (payload) => api("/marketplace/update", { method: "PUT", body: JSON.stringify(payload) }),
  cancel: (id) => api(`/marketplace/deleteById?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
};

export const offerApi = {
  mine: () => api("/offer/getAll"),
  one: (id) => api(`/offer/getById?id=${encodeURIComponent(id)}`),
  forListing: (listingId) => api(`/offer/listing/${encodeURIComponent(listingId)}`),
  add: (payload) => api("/offer/add", { method: "POST", body: JSON.stringify(payload) }),
  update: (payload) => api("/offer/update", { method: "PUT", body: JSON.stringify(payload) }),
  accept: (id) => api(`/offer/${encodeURIComponent(id)}/accept`, { method: "POST" }),
  decline: (id) => api(`/offer/${encodeURIComponent(id)}/decline`, { method: "POST" }),
  withdraw: (id) => api(`/offer/deleteById?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
};
