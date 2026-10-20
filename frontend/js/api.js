import { buildQuery } from "./format.js";

const API_BASE = window.MEDHMAR_API_URL || `http://${window.location.hostname}:8080`;
let csrf = null;

export function apiAssetUrl(path) {
  if (!path) return "";
  try {
    return new URL(path, `${API_BASE}/`).toString();
  } catch {
    return "";
  }
}

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
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    if (options.body && !isFormData && !headers.has("Content-Type")) {
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
  googleSignupRole: (role) => api("/api/auth/google/signup-role", {
    method: "POST",
    body: JSON.stringify({ role }),
  }),

  clearGoogleSignupRole: () => api("/api/auth/google/signup-role", {
    method: "DELETE",
  }),
  googleUrl: () => `${API_BASE}/oauth2/authorization/google`,
};

// The AI service is optional; read its status before enabling chat.
// Refresh CSRF before sending each question to support session-token rotation.
export const assistantApi = {
  status: () => api("/api/ai/status"),
  chat: async (payload) => {
    await refreshCsrf();
    return api("/api/ai/chat", { method: "POST", body: JSON.stringify(payload) });
  },
};

export const challengeApi = {
  list: () => api("/api/challenges?page=0&size=20"),
  one: (id) => api(`/api/challenges/${id}`),
  results: (id) => api(`/api/challenges/${id}/results`),
  vote: (id, camelId) => api(`/api/challenges/${id}/votes`, { method: "POST", body: JSON.stringify({ camelId }) }),
};

// Administrator discovery includes drafts and inactive organizations. Mutations reuse
// existing authenticated, server-authorized business endpoints and CSRF handling.
export const adminHealthApi = {
  check: () => api('/api/admin/system-health')
};

export const adminModulesApi = {
  challenges: (page = 0) => api('/api/admin/challenges' + buildQuery({page, size:20})),
  organizations: (page = 0) => api('/api/admin/organizations' + buildQuery({page, size:20})),
  createChallenge: (payload) => api('/api/challenges', {method:'POST',body:JSON.stringify(payload)}),
  updateChallenge: (id,payload) => api('/api/challenges/'+encodeURIComponent(id), {method:'PUT',body:JSON.stringify(payload)}),
  addChallengeCamel: (id,camelId) => api('/api/challenges/'+encodeURIComponent(id)+'/camels/'+encodeURIComponent(camelId), {method:'PUT'}),
  openChallenge: (id) => api('/api/challenges/'+encodeURIComponent(id)+'/open', {method:'POST'}),
  closeChallenge: (id) => api('/api/challenges/'+encodeURIComponent(id)+'/close', {method:'POST'}),
  createOrganization: (payload) => api('/api/organizations', {method:'POST',body:JSON.stringify(payload)}),
  updateOrganization: (id,payload) => api('/api/organizations/'+encodeURIComponent(id), {method:'PUT',body:JSON.stringify(payload)})
};

// Administrator moderation of the existing marketplace. Backend verifies the ADMIN role on every call.
export const adminMarketplaceApi = {
  list: (q = {}) => api('/api/admin/marketplace' + buildQuery({page: q.page || 0, size: 10, search: q.search, status: q.status, category: q.category, sort: q.sort})),
  stats: () => api('/api/admin/marketplace/stats'),
  categories: () => api('/api/admin/marketplace/categories'),
  one: (id) => api('/api/admin/marketplace/' + encodeURIComponent(id)),
  update: (id, payload) => api('/api/admin/marketplace/' + encodeURIComponent(id), {method:'PUT', body:JSON.stringify(payload)}),
  approve: (id) => api('/api/admin/marketplace/' + encodeURIComponent(id) + '/approve', {method:'POST'}),
  reject: (id, reason) => api('/api/admin/marketplace/' + encodeURIComponent(id) + '/reject', {method:'POST', body:JSON.stringify({reason: reason || null})}),
  setStatus: (id, status) => api('/api/admin/marketplace/' + encodeURIComponent(id) + '/status', {method:'PUT', body:JSON.stringify({status})}),
  remove: (id, reason) => api('/api/admin/marketplace/' + encodeURIComponent(id) + buildQuery({reason}), {method:'DELETE'})
};

export const adminApi = {
  dashboard: () => api("/api/admin/dashboard"),
  users: (page = 0) => api(`/api/admin/users?page=${Math.max(0, Math.trunc(Number(page) || 0))}&size=20`),
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
  list: () => api("/trainer-profile/getAll"),
  active: () => api("/trainer-profile/active"),
  get: (id) => api(`/trainer-profile/getById?id=${encodeURIComponent(id)}`),
  create: (payload) => api("/trainer-profile/add", { method: "POST", body: JSON.stringify(payload) }),
  update: (payload) => api("/trainer-profile/update", { method: "PUT", body: JSON.stringify(payload) }),
  uploadPhoto: (file) => {
    const body = new FormData();
    body.append("photo", file);
    return api("/trainer-profile/photo", { method: "POST", body });
  },
};

export const trainingApi = {
  logs: (agreementId) => api(`/api/training-logs/agreement/${agreementId}`),
  add: (payload) => api("/api/training-logs", { method: "POST", body: JSON.stringify(payload) }),
};

export const agreementApi = {
  list: () => api("/api/agreements"),
  mine: () => api("/api/agreements/mine"),
  assigned: () => api("/api/agreements/assigned"),
  activeAssignments: () => api("/api/agreements/active-assignments"),
  one: (id) => api(`/api/agreements/${encodeURIComponent(id)}`),
  add: (payload) => api("/api/agreements", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => api(`/api/agreements/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(payload) }),
  accept: (id) => api(`/api/agreements/${encodeURIComponent(id)}/accept`, { method: "POST" }),
  reject: (id, reason = null) => api(`/api/agreements/${encodeURIComponent(id)}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
  requestTermination: (id, reason) => api(`/api/agreements/${encodeURIComponent(id)}/terminate`, { method: "POST", body: JSON.stringify({ reason }) }),
  terminationRequests: () => api("/api/agreements/termination-requests"),
  decideTermination: (id, approve, notes = null) => api(`/api/agreements/${encodeURIComponent(id)}/termination-decision?approve=${approve}`, { method: "POST", body: JSON.stringify({ notes }) }),
};

// Audit history is read-only and only accessible to authenticated administrators.
export const adminAuditApi = {
  list: (filters = {}) => {
    const from = /^\d{4}-\d{2}-\d{2}$/.test(filters.from || '') ? filters.from + 'T00:00:00.000Z' : undefined;
    const to = /^\d{4}-\d{2}-\d{2}$/.test(filters.to || '') ? filters.to + 'T23:59:59.999Z' : undefined;
    return api('/api/admin/audit-logs' + buildQuery({
      page: filters.page || 0, size: 20,
      actionType: filters.actionType, entityType: filters.entityType,
      actorUserId: filters.actorUserId, from, to
    }));
  },
  one: (id) => api('/api/admin/audit-logs/' + encodeURIComponent(id))
};

export const pedigreeApi = {
  get: (camelId) => api(`/camel/${encodeURIComponent(camelId)}/pedigree`),
  tree: (camelId) => api(`/camel/${encodeURIComponent(camelId)}/pedigree/tree?generations=3`),
  update: (camelId, payload) => api(`/camel/${encodeURIComponent(camelId)}/pedigree`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),
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
  sale: (id) => api(`/offer/${encodeURIComponent(id)}/sale`),
  mine: () => api("/offer/getAll"),
  one: (id) => api(`/offer/getById?id=${encodeURIComponent(id)}`),
  forListing: (listingId) => api(`/offer/listing/${encodeURIComponent(listingId)}`),
  add: (payload) => api("/offer/add", { method: "POST", body: JSON.stringify(payload) }),
  update: (payload) => api("/offer/update", { method: "PUT", body: JSON.stringify(payload) }),
  accept: (id) => api(`/offer/${encodeURIComponent(id)}/accept`, { method: "POST" }),
  decline: (id) => api(`/offer/${encodeURIComponent(id)}/decline`, { method: "POST" }),
  withdraw: (id) => api(`/offer/deleteById?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
};
