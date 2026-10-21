import { adminApi, camelApi, apiAssetUrl } from "./api.js";
import { raceApi, raceEntryApi } from "./race-api.js";

const esc = value => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const icon = name => ({
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 2v6m8-6v6M4 10h16m-11 3v5m4-5v5m4-5v5"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/></svg>',
  sort: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 6 3-3 3 3m-6 4 3 3 3-3"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>',
  trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v6a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4M12 15v5m-4 0h8"/></svg>',
  flag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4m0 1c4-3 9 3 14 0v10c-5 3-10-3-14 0"/></svg>',
  users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m1-7a5 5 0 0 1 5 5v2"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4 20 4-1 11-11-3-3L5 16l-1 4Z"/><path d="m14 7 3 3"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="m10 2-.6 3-2 .8-2.6-1.6-2.8 4.8 2.5 1.8v2.4L2 15l2.8 4.8L7.4 18l2 .9.6 3.1h4l.6-3.1 2-.9 2.6 1.8L22 15l-2.5-1.8v-2.4L22 9l-2.8-4.8-2.6 1.6-2-.8-.6-3h-4Z"/><circle cx="12" cy="12" r="3.5"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 8 3v6c0 5-3 8-8 9-5-1-8-4-8-9V6l8-3Z"/><path d="m8 12 2.5 2.5L16 9"/></svg>',
  document:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v5h5M9 12h6m-6 4h6"/></svg>'
})[name]?.replaceAll(' aria-hidden="true"', "").replace("<svg ", '<svg aria-hidden="true" focusable="false" ') || "";

const fmtDateTime = value => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : date.toLocaleString("en-GB", {
    day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit"
  });
};

const localDateTimeValue = value => {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const statusTone = value => {
  const status = String(value || "").toUpperCase();
  if (status === "OPEN" || status === "ACCEPTED") return "success";
  if (status === "SCHEDULED" || status === "PENDING") return "warning";
  if (status === "REJECTED" || status === "CANCELLED") return "danger";
  return "neutral";
};

const validStatuses = ["SCHEDULED","OPEN","CLOSED","COMPLETED","CANCELLED"];

const camelMark = '<svg viewBox="0 0 64 48" fill="currentColor" aria-hidden="true"><path d="m5 30 3-9 5-4 7-1 4-5 5 1 5 5 10 1 4-9 1-6 5-1 3 2 5 1-2 4-7 1-2 14-5 8 2 12h-3l-5-12-13-1-3 13h-3l1-15-6 1-5 14H8l3-17-3-1-3 10H3Z"/></svg>';
const emptyState = (title, detail) => `<div class="admin-race-empty-state"><strong>${title}</strong><small>${detail}</small></div>`;
const imageUrl = value => {
  const url = apiAssetUrl(value);
  return /^https?:\/\//i.test(url) ? url : "";
};
const fallbackRaceCovers = [
  "/assets/mock-camels/camel-7.jpg",
  "/assets/mock-camels/camel-4.jpg",
  "/assets/mock-camels/camel-6.jpg",
  "/assets/mock-camels/camel-5.jpg",
  "/assets/mock-camels/camel-3.jpg",
  "/assets/mock-camels/camel-8.jpg"
];
const fallbackRaceCover = race => {
  const numericId = Number(race?.raceId);
  const index = Number.isFinite(numericId) ? Math.abs(Math.trunc(numericId) - 1) % fallbackRaceCovers.length : 0;
  return fallbackRaceCovers[index];
};
const dateCell = value => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.valueOf())) return "—";
  return `<span class="admin-race-cell-icon">${icon("calendar")}<time datetime="${esc(value)}">${date.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}<small>${date.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" })}</small></time></span>`;
};

function raceRowsMarkup(races, userName) {
  if (!races.length) return `<tr><td colspan="6" class="admin-race-empty">${emptyState("No races found", "Add a new race or adjust your search and filters.")}</td></tr>`;
  return races.map(race => {
    const fallback = fallbackRaceCover(race);
    const cover = imageUrl(race.coverImageUrl) || fallback;
    return `<tr>
      <td><div class="admin-race-identity"><span class="admin-race-thumbnail">${camelMark}<img src="${esc(cover)}" data-race-fallback-cover="${esc(fallback)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span><div><strong>${esc(race.name)}</strong><small>Race #${esc(race.raceId)}</small></div></div></td>
      <td>${dateCell(race.startsAt)}</td>
      <td><span class="admin-race-cell-icon">${icon("pin")}<span>${esc(race.location)}</span></span></td>
      <td><span class="admin-race-badge ${statusTone(race.status)}">${esc(race.status)}</span></td>
      <td><span class="admin-race-cell-icon">${icon("person")}<span>${esc(userName.get(String(race.organizerId)) || `User #${race.organizerId ?? "—"}`)}</span></span></td>
      <td><div class="admin-race-actions">
        <button type="button" class="admin-race-action" data-admin-race-view="${esc(race.raceId)}" aria-label="View ${esc(race.name)}">${icon("eye")}<span>View</span></button>
        <button type="button" class="admin-race-action" data-admin-race-edit="${esc(race.raceId)}" aria-label="Edit ${esc(race.name)}">${icon("edit")}<span>Edit</span></button>
        <details class="admin-race-more"><summary aria-label="More actions for ${esc(race.name)}">${icon("more")}</summary><div>
          <button type="button" data-admin-race-edit="${esc(race.raceId)}" data-race-field="organizerId">Assign organizer</button>
          <button type="button" data-admin-race-edit="${esc(race.raceId)}" data-race-field="status">Change status</button>
          <button type="button" data-admin-race-requests="${esc(race.raceId)}">Review requests</button>
        </div></details>
      </div></td>
    </tr>`;
  }).join("");
}

function pendingRowsMarkup(entries, userName, raceName, camelNames, filtered = false) {
  if (!entries.length) return `<tr><td colspan="6" class="admin-race-empty">${emptyState(filtered ? "No matching registration requests" : "No pending registration requests", filtered ? "Try another search or select All Races." : "All caught up! There are no pending camel registration requests at the moment.")}</td></tr>`;
  return entries.map(entry => `<tr>
      <td><strong>${esc(camelNames.get(String(entry.camelId)) || `Camel #${entry.camelId}`)}</strong><small>Camel #${esc(entry.camelId)}</small></td>
      <td>${esc(userName.get(String(entry.registrantId)) || `Owner #${entry.registrantId}`)}</td>
      <td>${esc(raceName.get(String(entry.raceId)) || `Race #${entry.raceId}`)}</td>
      <td>${dateCell(entry.registeredAt)}</td>
      <td><span class="admin-race-badge warning">PENDING</span></td>
      <td><div class="admin-race-decisions">
        <button type="button" class="admin-race-approve" data-admin-entry-decision="ACCEPTED" data-entry-id="${esc(entry.entryId)}">✓ Approve</button>
        <button type="button" class="admin-race-reject" data-admin-entry-decision="REJECTED" data-entry-id="${esc(entry.entryId)}">× Reject</button>
      </div></td>
    </tr>`).join("");
}

function pageDataMarkup({ races, entries, users, camelNames }) {
  const userName = new Map(users.map(user => [String(user.userId), user.fullName]));
  const raceName = new Map(races.map(race => [String(race.raceId), race.name]));
  const pending = entries.filter(entry => String(entry.entryStatus).toUpperCase() === "PENDING");
  const count = status => races.filter(race => String(race.status).toUpperCase() === status).length;
  const controls = [
    ["organizerId", "users", "Assign organizer", "Select the organizer responsible for each race."],
    ["requests", "shield", "Approve or reject entry requests", "Review camel registration requests submitted by owners."],
    ["status", "flag", "Manage race status", "Use the race states: SCHEDULED, OPEN, CLOSED, COMPLETED or CANCELLED."],
    ["view", "document", "View race information", "Review race details and assigned organizer information."]
  ];
  const sortHeader = (key, label) => `<th scope="col" aria-sort="none"><button type="button" data-race-sort="${key}">${label}${icon("sort")}</button></th>`;
  return `
    <section class="admin-race-hero" aria-labelledby="admin-race-title">
      <div class="admin-race-hero-copy"><span>RACE MANAGEMENT</span><h1 id="admin-race-title">Race Management</h1><p>Create new races and review camel registration requests<br class="admin-race-desktop-break"> for all races on the Medhmar platform.</p></div>
      <img class="admin-race-hero-art" src="/assets/admin-races/race-operations-hero.svg" width="900" height="240" alt="" aria-hidden="true">
    </section>
    <div class="admin-race-content">
      <div class="admin-race-create-toolbar">
        <button type="button" class="admin-race-primary" data-admin-race-create><span aria-hidden="true">＋</span><span>Add New Race</span></button>
      </div>
      <section class="admin-race-metrics" aria-label="Race summary">
        <article class="admin-race-metric-total"><span class="admin-race-metric-icon red">${icon("trophy")}</span><div><span>Total Races</span><div class="admin-race-count"><strong>${races.length}</strong>${count("OPEN") ? `<span class="admin-race-open-note" title="Races currently open for registration">↗ ${count("OPEN")} open</span>` : ""}</div><small>All races in the system</small></div></article>
        <article class="admin-race-metric-open"><span class="admin-race-metric-icon gold">${icon("flag")}</span><div><span>Open Races</span><strong>${count("OPEN")}</strong><small>Currently open for registration</small></div></article>
        <article class="admin-race-metric-pending"><span class="admin-race-metric-icon red">${icon("users")}</span><div><span>Pending Entry Requests</span><strong>${pending.length}</strong><small>Camel registration requests</small></div></article>
        <article class="admin-race-metric-completed"><span class="admin-race-metric-icon green">${icon("check")}</span><div><span>Completed Races</span><strong>${count("COMPLETED")}</strong><small>Finished races</small></div></article>
      </section>
      <div class="admin-race-main-grid">
        <section class="admin-race-panel admin-race-list-panel" aria-labelledby="admin-race-list-title">
          <div class="admin-race-panel-head"><div class="admin-race-heading"><div><h2 id="admin-race-list-title">Race List</h2><p>Manage all camel races on the platform.</p></div></div>
            <div class="admin-race-toolbar"><label class="admin-race-search">${icon("search")}<input type="search" data-race-search placeholder="Search races..." aria-label="Search races"></label><select data-race-status-filter aria-label="Filter races by status"><option value="">All Statuses</option>${validStatuses.map(status => `<option value="${status}">${status}</option>`).join("")}</select></div>
          </div>
          <div class="admin-race-table-wrap" role="region" aria-label="Race list" tabindex="0"><table class="admin-race-table"><thead><tr><th scope="col">Race Name</th>${sortHeader("startsAt", "Date")}${sortHeader("location", "Location")}${sortHeader("status", "Status")}${sortHeader("organizerId", "Organizer")}<th scope="col">Actions</th></tr></thead><tbody data-race-rows>${raceRowsMarkup(races, userName)}</tbody></table></div>
        </section>
        <aside class="admin-race-controls-panel" aria-labelledby="admin-race-controls-title">
          <div class="admin-race-controls-title"><span>${icon("gear")}</span><div><h2 id="admin-race-controls-title">Admin Controls</h2><p>Your responsibilities for race management.</p></div></div>
          ${controls.map(([action, glyph, title, detail]) => `<button type="button" class="admin-race-control-item" data-admin-race-control="${action}"><span>${icon(glyph)}</span><span class="admin-race-control-copy"><strong>${title}</strong><small>${detail}</small></span>${icon("chevron")}</button>`).join("")}
        </aside>
        <section class="admin-race-panel admin-race-requests-panel" aria-labelledby="admin-race-requests-title" tabindex="-1">
          <div class="admin-race-panel-head"><div class="admin-race-heading"><span class="admin-race-heading-icon red">${icon("users")}</span><div><h2 id="admin-race-requests-title">Pending Camel Registration Requests</h2><p>Review and approve or reject camel registration requests for upcoming races.</p></div></div><div class="admin-race-toolbar"><label class="admin-race-search">${icon("search")}<input type="search" data-entry-search placeholder="Search requests..." aria-label="Search registration requests"></label><select data-entry-race-filter aria-label="Filter requests by race"><option value="">All Races</option>${races.map(race => `<option value="${esc(race.raceId)}">${esc(race.name)}</option>`).join("")}</select></div></div>
          <div class="admin-race-table-wrap" role="region" aria-label="Pending registration requests" tabindex="0"><table class="admin-race-table"><thead><tr><th scope="col">Camel</th><th scope="col">Owner</th><th scope="col">Race</th><th scope="col">Submitted At</th><th scope="col">Status</th><th scope="col">Decision</th></tr></thead><tbody data-entry-rows>${pendingRowsMarkup(pending, userName, raceName, camelNames)}</tbody></table></div>
        </section>
      </div>
      <p class="admin-race-sr-only" role="status" data-race-result-count></p>
    </div>`;
}

function raceDetailsModal(race, users) {
  const userName = new Map((users || []).map(user => [String(user.userId), user.fullName]));
  return `
    <div class="modal-backdrop" id="admin-race-view-modal">
      <div class="modal admin-race-view-modal" role="dialog" aria-modal="true" aria-labelledby="admin-race-view-title">
        <div class="admin-race-modal-head">
          <div><span>RACE INFORMATION</span><h2 id="admin-race-view-title">${esc(race.name)}</h2></div>
          <button type="button" data-admin-race-view-close aria-label="Close">×</button>
        </div>
        <div class="admin-race-view-grid">
          <div><span>Race ID</span><strong>#${esc(race.raceId)}</strong></div>
          <div><span>Status</span><strong><span class="admin-race-badge ${statusTone(race.status)}">${esc(race.status)}</span></strong></div>
          <div><span>Starts At</span><strong>${fmtDateTime(race.startsAt)}</strong></div>
          <div><span>Distance</span><strong>${esc(race.distanceKm)} KM</strong></div>
          <div><span>Location</span><strong>${esc(race.location)}</strong></div>
          <div><span>Organizer</span><strong>${esc(userName.get(String(race.organizerId)) || `User #${race.organizerId}`)}</strong></div>
          <div><span>Organization ID</span><strong>${race.organizationId ? "#" + esc(race.organizationId) : "—"}</strong></div>
        </div>
        <div class="admin-race-form-actions">
          <button type="button" class="admin-race-secondary" data-admin-race-view-close>Close</button>
          <button type="button" class="admin-race-primary" data-admin-race-view-edit="${esc(race.raceId)}">${icon("edit")}<span>Edit Race</span></button>
        </div>
      </div>
    </div>
  `;
}

function raceForm(race = null, organizers = []) {
  const editing = Boolean(race);
  const statuses = editing ? validStatuses : ["SCHEDULED", "OPEN"];
  const options = organizers.map(user => `
    <option value="${esc(user.userId)}" ${String(user.userId) === String(race?.organizerId ?? "") ? "selected" : ""}>${esc(user.fullName)} (#${esc(user.userId)})</option>
  `).join("");

  return `
    <div class="modal-backdrop" id="admin-race-modal">
      <div class="modal admin-race-modal" role="dialog" aria-modal="true" aria-labelledby="admin-race-modal-title">
        <div class="admin-race-modal-head">
          <div><span>ADMIN RACE CONTROL</span><h2 id="admin-race-modal-title">${editing ? "Edit Race" : "Add New Race"}</h2></div>
          <button type="button" data-admin-race-close aria-label="Close">×</button>
        </div>
        <form id="admin-race-form" class="admin-race-form" data-race-id="${esc(race?.raceId || "")}">
          <label class="span-2"><span>Race Name</span><input name="name" maxlength="150" required value="${esc(race?.name || "")}"></label>
          <label><span>Start Date & Time</span><input type="datetime-local" name="startsAt" required value="${esc(localDateTimeValue(race?.startsAt))}"></label>
          <label><span>Distance (KM)</span><input type="number" name="distanceKm" min="0.1" step="0.1" required value="${esc(race?.distanceKm || "")}"></label>
          <label class="span-2"><span>Location</span><input name="location" maxlength="255" required value="${esc(race?.location || "")}"></label>
          <label><span>Status</span><select name="status" required>${statuses.map(status => `<option value="${status}" ${status === String(race?.status || "SCHEDULED") ? "selected" : ""}>${status}</option>`).join("")}</select></label>
          <label><span>Organizer</span><select name="organizerId" required><option value="">Select organizer</option>${options}</select></label>
          <label><span>Organization ID</span><input type="number" name="organizationId" min="1" value="${esc(race?.organizationId || "")}" placeholder="Optional"></label>
          <label><span>Cover Image URL</span><input type="url" name="coverImageUrl" maxlength="2048" value="${esc(race?.coverImageUrl || "")}" placeholder="Optional"></label>
          <label class="span-2"><span>Results Image URL</span><input type="url" name="resultsImageUrl" maxlength="2048" value="${esc(race?.resultsImageUrl || "")}" placeholder="Optional"></label>
          <div class="admin-race-form-feedback span-2" data-admin-race-feedback role="alert" hidden></div>
          <div class="admin-race-form-actions span-2">
            <button type="button" class="admin-race-secondary" data-admin-race-close>Cancel</button>
            <button type="submit" class="admin-race-primary">${editing ? "Save Changes" : "Create Race"}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function racePayload(form) {
  const data = new FormData(form);
  return {
    name: String(data.get("name") || "").trim(),
    startsAt: new Date(data.get("startsAt")).toISOString(),
    location: String(data.get("location") || "").trim(),
    distanceKm: Number(data.get("distanceKm")),
    status: String(data.get("status")),
    coverImageUrl: String(data.get("coverImageUrl") || "").trim() || null,
    resultsImageUrl: String(data.get("resultsImageUrl") || "").trim() || null,
    organizerId: Number(data.get("organizerId")),
    organizationId: data.get("organizationId") ? Number(data.get("organizationId")) : null
  };
}

export function adminRacesView() {
  return '<section class="admin-races-page" data-admin-races><div class="admin-race-loading" role="status">Loading race management…</div></section>';
}

export function bindAdminRaces(root = document, { notify = () => {} } = {}) {
  const page = root.querySelector("[data-admin-races]");
  if (!page || page.dataset.bound === "true") return;
  page.dataset.bound = "true";

  let current = { races: [], entries: [], users: [], organizers: [], camelNames: new Map() };
  let sort = { key: "", direction: 1 };
  let version = 0;
  let disposed = false;
  let returnFocus = null;
  const filters = { raceSearch: "", raceStatus: "", entrySearch: "", entryRace: "" };
  const alive = () => !disposed && page.isConnected;
  const closeModals = () => {
    document.querySelectorAll("[data-admin-race-dialog]").forEach(modal => modal.remove());
    if (returnFocus?.isConnected) returnFocus.focus();
  };
  const observer = new MutationObserver(() => { if (!page.isConnected) dispose(); });
  const dispose = () => {
    disposed = true;
    version += 1;
    observer.disconnect();
    closeModals();
    current = { races: [], entries: [], users: [], organizers: [], camelNames: new Map() };
  };
  observer.observe(page.closest("#app") || root, { childList: true, subtree: true });

  const showModal = markup => {
    closeModals();
    returnFocus = document.activeElement;
    document.body.insertAdjacentHTML("beforeend", markup);
    const modal = document.body.lastElementChild;
    modal.setAttribute("data-admin-race-dialog", "");
    modal.addEventListener("click", event => { if (event.target === modal) closeModals(); });
    modal.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault(); closeModals(); }
      if (event.key !== "Tab") return;
      const elements = [...modal.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]')].filter(el => !el.hidden);
      const first = elements[0], last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    (modal.querySelector("input, select") || modal.querySelector("button"))?.focus();
    return modal;
  };

  const userNames = () => new Map(current.users.map(user => [String(user.userId), user.fullName]));
  const raceNames = () => new Map(current.races.map(race => [String(race.raceId), race.name]));
  const filteredRaces = () => {
    const term = filters.raceSearch.trim().toLowerCase();
    const names = userNames();
    const rows = current.races.filter(race =>
      (!term || `${race.name} ${race.location} ${race.raceId} ${names.get(String(race.organizerId)) || ""}`.toLowerCase().includes(term)) &&
      (!filters.raceStatus || race.status === filters.raceStatus)
    );
    if (sort.key) rows.sort((a, b) => {
      const value = item => sort.key === "organizerId" ? names.get(String(item.organizerId)) || String(item.organizerId) : String(item[sort.key] ?? "");
      return value(a).localeCompare(value(b), "en", { numeric: true }) * sort.direction;
    });
    return rows;
  };
  const filteredEntries = () => {
    const term = filters.entrySearch.trim().toLowerCase();
    const races = raceNames(), users = userNames();
    return current.entries.filter(entry => String(entry.entryStatus).toUpperCase() === "PENDING")
      .filter(entry => !filters.entryRace || String(entry.raceId) === filters.entryRace)
      .filter(entry => !term || `${entry.camelId} ${current.camelNames.get(String(entry.camelId)) || ""} ${users.get(String(entry.registrantId)) || ""} ${races.get(String(entry.raceId)) || ""}`.toLowerCase().includes(term));
  };
  const rerenderRaceRows = () => {
    const target = page.querySelector("[data-race-rows]");
    if (!target) return;
    const rows = filteredRaces();
    target.innerHTML = raceRowsMarkup(rows, userNames());
    page.querySelector("[data-race-result-count]").textContent = `${rows.length} races shown.`;
    page.querySelectorAll("[data-race-sort]").forEach(button => button.closest("th").setAttribute("aria-sort", button.dataset.raceSort === sort.key ? sort.direction === 1 ? "ascending" : "descending" : "none"));
    bindRowActions();
  };
  const rerenderEntryRows = () => {
    const target = page.querySelector("[data-entry-rows]");
    if (!target) return;
    const rows = filteredEntries();
    target.innerHTML = pendingRowsMarkup(rows, userNames(), raceNames(), current.camelNames, Boolean(filters.entrySearch || filters.entryRace));
    page.querySelector("[data-race-result-count]").textContent = `${rows.length} pending requests shown.`;
    bindDecisionActions();
  };
  const showRequests = (raceId = "") => {
    filters.entryRace = raceId;
    filters.entrySearch = "";
    page.querySelector("[data-entry-race-filter]").value = raceId;
    page.querySelector("[data-entry-search]").value = "";
    rerenderEntryRows();
    const panel = page.querySelector(".admin-race-requests-panel");
    panel.scrollIntoView({ block: "center", behavior: "auto" });
    page.querySelector("[data-entry-search]").focus({ preventScroll: true });
  };
  const failAuthorization = error => {
    if (![401, 403].includes(error?.status)) return false;
    closeModals();
    current = { races: [], entries: [], users: [], organizers: [], camelNames: new Map() };
    page.innerHTML = '<div class="admin-race-error" role="alert"><h2>Administrator access unavailable</h2><p>Your session or administrator permissions have changed.</p><a class="admin-race-primary" href="/signin" data-link>Sign in again</a></div>';
    return true;
  };
  const openEdit = (race, field = "name") => {
    if (!alive()) return;
    const modal = showModal(raceForm(race, current.organizers));
    modal.querySelector(`[name="${field}"]`)?.focus();
    modal.querySelectorAll("[data-admin-race-close]").forEach(button => button.addEventListener("click", closeModals));
    modal.querySelector("#admin-race-form").addEventListener("submit", async event => {
      event.preventDefault();
      if (!alive()) return;
      const form = event.currentTarget;
      const submit = form.querySelector('[type="submit"]');
      if (submit.disabled) return;
      const feedback = form.querySelector("[data-admin-race-feedback]");
      submit.disabled = true;
      feedback.hidden = true;
      try {
        const payload = racePayload(form);
        if (form.dataset.raceId) await raceApi.updateRace(form.dataset.raceId, payload);
        else await raceApi.createRace(payload);
        if (!alive()) return;
        notify(form.dataset.raceId ? "Race updated successfully." : "Race created successfully.", "success");
        closeModals();
        await load();
      } catch (error) {
        if (!alive() || failAuthorization(error)) return;
        feedback.hidden = false;
        feedback.textContent = error?.message || "Unable to save race.";
        submit.disabled = false;
      }
    });
  };
  const openView = race => {
    if (!alive()) return;
    const modal = showModal(raceDetailsModal(race, current.users));
    modal.querySelectorAll("[data-admin-race-view-close]").forEach(button => button.addEventListener("click", closeModals));
    modal.querySelector("[data-admin-race-view-edit]").addEventListener("click", () => openEdit(race));
  };
  const chooseRace = action => {
    const title = { organizerId: "Assign organizer", status: "Manage race status", view: "View race information" }[action];
    const modal = showModal(`<div class="modal-backdrop"><div class="modal admin-race-view-modal" role="dialog" aria-modal="true" aria-labelledby="admin-race-choose-title"><div class="admin-race-modal-head"><div><span>RACE MANAGEMENT</span><h2 id="admin-race-choose-title">${title}</h2></div><button type="button" data-race-choose-close aria-label="Close">×</button></div><form class="admin-race-choose-form"><label for="admin-race-choice">Select a race</label><select id="admin-race-choice" name="raceId" required><option value="">Choose race</option>${current.races.map(race => `<option value="${esc(race.raceId)}">${esc(race.name)}</option>`).join("")}</select>${current.races.length ? "" : "<p>No races available. Create a race first.</p>"}<div class="admin-race-form-actions"><button class="admin-race-secondary" type="button" data-race-choose-close>Cancel</button><button class="admin-race-primary" type="submit" ${current.races.length ? "" : "disabled"}>Continue</button></div></form></div></div>`);
    modal.querySelectorAll("[data-race-choose-close]").forEach(button => button.addEventListener("click", closeModals));
    modal.querySelector("form").addEventListener("submit", event => {
      event.preventDefault();
      const race = current.races.find(item => String(item.raceId) === modal.querySelector("select").value);
      if (race) action === "view" ? openView(race) : openEdit(race, action);
    });
  };
  const bindRowActions = () => {
    page.querySelectorAll("[data-admin-race-view]").forEach(button => button.addEventListener("click", () => {
      const race = current.races.find(item => String(item.raceId) === button.dataset.adminRaceView);
      if (race) openView(race);
    }));
    page.querySelectorAll("[data-admin-race-edit]").forEach(button => button.addEventListener("click", () => {
      button.closest("details")?.removeAttribute("open");
      const race = current.races.find(item => String(item.raceId) === button.dataset.adminRaceEdit);
      if (race) openEdit(race, button.dataset.raceField || "name");
    }));
    page.querySelectorAll("[data-admin-race-requests]").forEach(button => button.addEventListener("click", () => {
      button.closest("details").removeAttribute("open");
      showRequests(button.dataset.adminRaceRequests);
    }));
    page.querySelectorAll(".admin-race-thumbnail img").forEach(img => {
      const fallback = img.dataset.raceFallbackCover;
      const useFallback = () => {
        if (!fallback || img.getAttribute("src") === fallback) return;
        img.setAttribute("src", fallback);
      };
      img.addEventListener("error", useFallback);
      if (img.complete && !img.naturalWidth) useFallback();
    });
  };
  const bindDecisionActions = () => {
    page.querySelectorAll("[data-admin-entry-decision]").forEach(button => button.addEventListener("click", async () => {
      if (!alive() || button.disabled) return;
      const buttons = button.closest("td").querySelectorAll("button");
      buttons.forEach(item => { item.disabled = true; });
      try {
        await raceEntryApi.updateStatus(button.dataset.entryId, { entryStatus: button.dataset.adminEntryDecision });
        if (!alive()) return;
        notify(`Registration ${button.dataset.adminEntryDecision.toLowerCase()}.`, "success");
        await load();
      } catch (error) {
        if (!alive() || failAuthorization(error)) return;
        notify(error?.message || "Unable to update registration.", "error");
        buttons.forEach(item => { item.disabled = false; });
      }
    }));
  };
  const bindPageActions = () => {
    page.querySelector("[data-admin-race-create]").addEventListener("click", () => openEdit(null));
    for (const [selector, name, event, render] of [
      ["[data-race-search]", "raceSearch", "input", rerenderRaceRows],
      ["[data-race-status-filter]", "raceStatus", "change", rerenderRaceRows],
      ["[data-entry-search]", "entrySearch", "input", rerenderEntryRows],
      ["[data-entry-race-filter]", "entryRace", "change", rerenderEntryRows]
    ]) {
      const field = page.querySelector(selector);
      field.value = filters[name];
      field.addEventListener(event, () => { filters[name] = field.value; render(); });
    }
    page.querySelectorAll("[data-race-sort]").forEach(button => button.addEventListener("click", () => {
      sort = { key: button.dataset.raceSort, direction: sort.key === button.dataset.raceSort ? -sort.direction : 1 };
      rerenderRaceRows();
    }));
    page.querySelectorAll("[data-admin-race-control]").forEach(button => button.addEventListener("click", () => {
      const action = button.dataset.adminRaceControl;
      if (action === "requests") showRequests();
      else chooseRace(action);
    }));
    rerenderRaceRows();
    rerenderEntryRows();
  };
  const allPages = async (first, fetchPage) => {
    if (Array.isArray(first)) return first;
    if (!Array.isArray(first?.content)) throw new Error("Invalid server response. Please try again.");
    const rows = [...first.content];
    for (let index = 1; index < (first.totalPages || 1); index += 1) {
      if (!alive()) return [];
      const next = await fetchPage(index);
      if (!Array.isArray(next?.content)) throw new Error("Unable to load all records. Please try again.");
      rows.push(...next.content);
    }
    return rows;
  };
  const load = async () => {
    if (!alive()) return;
    const requestVersion = ++version;
    page.innerHTML = '<div class="admin-race-loading" role="status">Loading race management…</div>';
    try {
      const [racePage, entries, firstUserPage] = await Promise.all([
        raceApi.getRaces("", "", 0, 100), raceEntryApi.getAll(), adminApi.users(0)
      ]);
      if (!alive() || requestVersion !== version) return;
      if (!Array.isArray(entries)) throw new Error("Unable to load registration requests.");
      const [races, users] = await Promise.all([
        allPages(racePage, index => raceApi.getRaces("", "", index, 100)),
        allPages(firstUserPage, index => adminApi.users(index))
      ]);
      const organizers = users.filter(user => Array.isArray(user.roles) && user.roles.some(role => ["ORGANIZER", "ADMIN"].includes(role)));
      const pending = entries.filter(entry => String(entry.entryStatus).toUpperCase() === "PENDING");
      const camelNames = new Map();
      const ids = [...new Set(pending.map(entry => entry.camelId))];
      for (let offset = 0; offset < ids.length; offset += 10) {
        if (!alive() || requestVersion !== version) return;
        await Promise.all(ids.slice(offset, offset + 10).map(async id => {
          try { const camel = await camelApi.one(id); camelNames.set(String(id), camel?.name || `Camel #${id}`); }
          catch (error) {
            if ([401, 403].includes(error?.status)) throw error;
            camelNames.set(String(id), `Camel #${id}`);
          }
        }));
      }
      if (!alive() || requestVersion !== version) return;
      current = { races, entries, users, organizers, camelNames };
      page.innerHTML = pageDataMarkup(current);
      bindPageActions();
    } catch (error) {
      if (!alive() || requestVersion !== version || failAuthorization(error)) return;
      current = { races: [], entries: [], users: [], organizers: [], camelNames: new Map() };
      page.innerHTML = `<div class="admin-race-error" role="alert"><h2>Unable to load race management</h2><p>${esc(error?.message || "Race management data could not be loaded.")}</p><button type="button" class="admin-race-primary" data-admin-race-retry>Try Again</button></div>`;
      page.querySelector("[data-admin-race-retry]").addEventListener("click", load);
    }
  };
  load();
  return dispose;
}
