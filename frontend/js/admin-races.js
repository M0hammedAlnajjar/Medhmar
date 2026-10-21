import { adminApi, camelApi } from "./api.js";
import { raceApi, raceEntryApi } from "./race-api.js";

const esc = value => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const icon = name => ({
  trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v6a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4M12 15v5m-4 0h8"/></svg>',
  flag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4m0 1c4-3 9 3 14 0v10c-5 3-10-3-14 0"/></svg>',
  users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m1-7a5 5 0 0 1 5 5v2"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4 20 4-1 11-11-3-3L5 16l-1 4Z"/><path d="m14 7 3 3"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.7a7 7 0 0 0-.8-1.9l.9-1.9-2.1-2.1-1.9.9a7 7 0 0 0-1.9-.8L10.5 2h-3l-.7 2a7 7 0 0 0-1.9.8L3 3.9.9 6l.9 1.9A7 7 0 0 0 1 9.8l-2 .7v3l2 .7a7 7 0 0 0 .8 1.9L.9 18l2.1 2.1 1.9-.9a7 7 0 0 0 1.9.8l.7 2h3l.7-2a7 7 0 0 0 1.9-.8l1.9.9L18 18l-.9-1.9a7 7 0 0 0 .8-1.9l1.1-.7Z"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 8 3v6c0 5-3 8-8 9-5-1-8-4-8-9V6l8-3Z"/><path d="m8 12 2.5 2.5L16 9"/></svg>',
  document:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v5h5M9 12h6m-6 4h6"/></svg>'
})[name] || "";

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

function raceRowsMarkup(races, userName) {
  if (!races.length) return '<tr><td colspan="6" class="admin-race-empty">No races match this search.</td></tr>';
  return races.map(race => `
    <tr>
      <td><strong>${esc(race.name)}</strong><small>Race #${esc(race.raceId)}</small></td>
      <td>${fmtDateTime(race.startsAt)}</td>
      <td>${esc(race.location)}</td>
      <td><span class="admin-race-badge ${statusTone(race.status)}">${esc(race.status)}</span></td>
      <td>${esc(userName.get(String(race.organizerId)) || `User #${race.organizerId ?? "—"}`)}</td>
      <td class="admin-race-actions">
        <button type="button" class="admin-race-action" data-admin-race-view="${esc(race.raceId)}">${icon("eye")}<span>View</span></button>
        <button type="button" class="admin-race-action" data-admin-race-edit="${esc(race.raceId)}">${icon("edit")}<span>Edit</span></button>
      </td>
    </tr>
  `).join("");
}

function pendingRowsMarkup(entries, userName, raceName, camelNames) {
  if (!entries.length) return '<tr><td colspan="6" class="admin-race-empty">No pending registration requests.</td></tr>';
  return entries.map(entry => `
    <tr>
      <td><strong>${esc(camelNames.get(String(entry.camelId)) || `Camel #${entry.camelId}`)}</strong><small>Camel #${esc(entry.camelId)}</small></td>
      <td>${esc(userName.get(String(entry.registrantId)) || `Owner #${entry.registrantId}`)}</td>
      <td>${esc(raceName.get(String(entry.raceId)) || `Race #${entry.raceId}`)}</td>
      <td>${fmtDateTime(entry.registeredAt)}</td>
      <td><span class="admin-race-badge warning">PENDING</span></td>
      <td class="admin-race-decisions">
        <button type="button" class="admin-race-approve" data-admin-entry-decision="ACCEPTED" data-entry-id="${esc(entry.entryId)}">✓ Approve</button>
        <button type="button" class="admin-race-reject" data-admin-entry-decision="REJECTED" data-entry-id="${esc(entry.entryId)}">× Reject</button>
      </td>
    </tr>
  `).join("");
}

function pageDataMarkup({ races, entries, users, camelNames }) {
  const userName = new Map((users || []).map(user => [String(user.userId), user.fullName]));
  const raceName = new Map((races || []).map(race => [String(race.raceId), race.name]));
  const pending = (entries || []).filter(entry => String(entry.entryStatus).toUpperCase() === "PENDING");
  const count = status => races.filter(race => String(race.status).toUpperCase() === status).length;
  const raceFilterOptions = races.map(race => `<option value="${esc(race.raceId)}">${esc(race.name)}</option>`).join("");

  return `
    <section class="admin-race-hero">
      <div>
        <span>RACE MANAGEMENT</span>
        <h1>Race Management</h1>
        <p>Create new races and review camel registration requests for all races on the Medhmar platform.</p>
      </div>
      <button type="button" class="admin-race-primary" data-admin-race-create>${icon("plus")}<span>Add New Race</span></button>
    </section>

    <section class="admin-race-metrics" aria-label="Race summary">
      <article><span class="admin-race-metric-icon red">${icon("trophy")}</span><div><span>Total Races</span><strong>${races.length}</strong><small>All races in the system</small></div></article>
      <article><span class="admin-race-metric-icon gold">${icon("flag")}</span><div><span>Open Races</span><strong>${count("OPEN")}</strong><small>Currently open for registration</small></div></article>
      <article><span class="admin-race-metric-icon red">${icon("users")}</span><div><span>Pending Entry Requests</span><strong>${pending.length}</strong><small>Camel registration requests</small></div></article>
      <article><span class="admin-race-metric-icon green">${icon("check")}</span><div><span>Completed Races</span><strong>${count("COMPLETED")}</strong><small>Finished races</small></div></article>
    </section>

    <div class="admin-race-main-grid">
      <section class="admin-race-panel admin-race-list-panel">
        <div class="admin-race-panel-head">
          <div><h2>Race List</h2><p>Manage all camel races on the platform.</p></div>
          <div class="admin-race-toolbar">
            <label class="admin-race-search">${icon("search")}<input type="search" data-race-search placeholder="Search races..." aria-label="Search races"></label>
            <select data-race-status-filter aria-label="Filter races by status">
              <option value="">All Statuses</option>
              ${validStatuses.map(status => `<option value="${status}">${status}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="admin-race-table-wrap">
          <table class="admin-race-table">
            <thead><tr><th>Race Name</th><th>Date</th><th>Location</th><th>Status</th><th>Organizer</th><th>Actions</th></tr></thead>
            <tbody data-race-rows>${raceRowsMarkup(races, userName)}</tbody>
          </table>
        </div>
      </section>

      <aside class="admin-race-controls-panel">
        <div class="admin-race-controls-title"><span>${icon("gear")}</span><div><h2>Admin Controls</h2><p>Your responsibilities for race management.</p></div></div>
        <div class="admin-race-control-item"><span>${icon("plus")}</span><div><strong>Create new races</strong><small>Add and configure races with date, location and details.</small></div></div>
        <div class="admin-race-control-item"><span>${icon("users")}</span><div><strong>Assign organizer</strong><small>Select the organizer responsible for each race.</small></div></div>
        <div class="admin-race-control-item"><span>${icon("shield")}</span><div><strong>Approve or reject entry requests</strong><small>Review camel registration requests submitted by owners.</small></div></div>
        <div class="admin-race-control-item"><span>${icon("flag")}</span><div><strong>Manage race status</strong><small>Use the backend race states: SCHEDULED, OPEN, CLOSED, COMPLETED or CANCELLED.</small></div></div>
        <div class="admin-race-control-item"><span>${icon("document")}</span><div><strong>View race information</strong><small>Review race details and assigned organizer information.</small></div></div>
      </aside>
    </div>

    <section class="admin-race-panel">
      <div class="admin-race-panel-head">
        <div><h2>Pending Camel Registration Requests</h2><p>Review and approve or reject camel registration requests for upcoming races.</p></div>
        <div class="admin-race-toolbar">
          <label class="admin-race-search">${icon("search")}<input type="search" data-entry-search placeholder="Search requests..." aria-label="Search registration requests"></label>
          <select data-entry-race-filter aria-label="Filter requests by race">
            <option value="">All Races</option>
            ${raceFilterOptions}
          </select>
        </div>
      </div>
      <div class="admin-race-table-wrap">
        <table class="admin-race-table">
          <thead><tr><th>Camel</th><th>Owner</th><th>Race</th><th>Submitted At</th><th>Status</th><th>Decision</th></tr></thead>
          <tbody data-entry-rows>${pendingRowsMarkup(pending, userName, raceName, camelNames)}</tbody>
        </table>
      </div>
    </section>
  `;
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
          <div class="admin-race-form-feedback span-2" data-admin-race-feedback hidden></div>
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
  const closeEditModal = () => document.querySelector("#admin-race-modal")?.remove();
  const closeViewModal = () => document.querySelector("#admin-race-view-modal")?.remove();

  const filteredRaces = () => {
    const term = String(page.querySelector("[data-race-search]")?.value || "").trim().toLowerCase();
    const status = page.querySelector("[data-race-status-filter]")?.value || "";
    return current.races.filter(race =>
      (!term || `${race.name} ${race.location} ${race.raceId}`.toLowerCase().includes(term)) &&
      (!status || race.status === status)
    );
  };

  const filteredEntries = () => {
    const term = String(page.querySelector("[data-entry-search]")?.value || "").trim().toLowerCase();
    const raceId = page.querySelector("[data-entry-race-filter]")?.value || "";
    const raceName = new Map(current.races.map(r => [String(r.raceId), r.name]));
    const userName = new Map(current.users.map(u => [String(u.userId), u.fullName]));
    return current.entries.filter(entry => String(entry.entryStatus).toUpperCase() === "PENDING")
      .filter(entry => !raceId || String(entry.raceId) === raceId)
      .filter(entry => {
        const haystack = `${current.camelNames.get(String(entry.camelId)) || ""} ${userName.get(String(entry.registrantId)) || ""} ${raceName.get(String(entry.raceId)) || ""}`.toLowerCase();
        return !term || haystack.includes(term);
      });
  };

  const rerenderRaceRows = () => {
    const target = page.querySelector("[data-race-rows]");
    if (!target) return;
    const userName = new Map(current.users.map(user => [String(user.userId), user.fullName]));
    target.innerHTML = raceRowsMarkup(filteredRaces(), userName);
    bindRowActions();
  };

  const rerenderEntryRows = () => {
    const target = page.querySelector("[data-entry-rows]");
    if (!target) return;
    const userName = new Map(current.users.map(user => [String(user.userId), user.fullName]));
    const raceName = new Map(current.races.map(race => [String(race.raceId), race.name]));
    target.innerHTML = pendingRowsMarkup(filteredEntries(), userName, raceName, current.camelNames);
    bindDecisionActions();
  };

  const openEdit = race => {
    closeViewModal();
    document.body.insertAdjacentHTML("beforeend", raceForm(race, current.organizers));
    bindEditModal();
  };

  const openView = race => {
    document.body.insertAdjacentHTML("beforeend", raceDetailsModal(race, current.users));
    const modal = document.querySelector("#admin-race-view-modal");
    modal?.querySelectorAll("[data-admin-race-view-close]").forEach(button => button.addEventListener("click", closeViewModal));
    modal?.querySelector("[data-admin-race-view-edit]")?.addEventListener("click", () => openEdit(race));
    modal?.addEventListener("click", event => { if (event.target === modal) closeViewModal(); });
  };

  const bindRowActions = () => {
    page.querySelectorAll("[data-admin-race-view]").forEach(button => button.addEventListener("click", () => {
      const race = current.races.find(item => String(item.raceId) === String(button.dataset.adminRaceView));
      if (race) openView(race);
    }));
    page.querySelectorAll("[data-admin-race-edit]").forEach(button => button.addEventListener("click", () => {
      const race = current.races.find(item => String(item.raceId) === String(button.dataset.adminRaceEdit));
      if (race) openEdit(race);
    }));
  };

  const bindDecisionActions = () => {
    page.querySelectorAll("[data-admin-entry-decision]").forEach(button => button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await raceEntryApi.updateStatus(button.dataset.entryId, { entryStatus: button.dataset.adminEntryDecision });
        notify(`Registration ${button.dataset.adminEntryDecision.toLowerCase()}.`, "success");
        await load();
      } catch (error) {
        notify(error?.message || "Unable to update registration.", "error");
        button.disabled = false;
      }
    }));
  };

  const bindPageActions = () => {
    page.querySelector("[data-admin-race-create]")?.addEventListener("click", () => openEdit(null));
    page.querySelector("[data-race-search]")?.addEventListener("input", rerenderRaceRows);
    page.querySelector("[data-race-status-filter]")?.addEventListener("change", rerenderRaceRows);
    page.querySelector("[data-entry-search]")?.addEventListener("input", rerenderEntryRows);
    page.querySelector("[data-entry-race-filter]")?.addEventListener("change", rerenderEntryRows);
    bindRowActions();
    bindDecisionActions();
  };

  const bindEditModal = () => {
    const modal = document.querySelector("#admin-race-modal");
    if (!modal) return;
    modal.querySelectorAll("[data-admin-race-close]").forEach(button => button.addEventListener("click", closeEditModal));
    modal.addEventListener("click", event => { if (event.target === modal) closeEditModal(); });
    modal.querySelector("#admin-race-form")?.addEventListener("submit", async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const submit = form.querySelector('[type="submit"]');
      const feedback = form.querySelector("[data-admin-race-feedback]");
      submit.disabled = true;
      feedback.hidden = true;
      try {
        const payload = racePayload(form);
        if (form.dataset.raceId) {
          await raceApi.updateRace(form.dataset.raceId, payload);
          notify("Race updated successfully.", "success");
        } else {
          await raceApi.createRace(payload);
          notify("Race created successfully.", "success");
        }
        closeEditModal();
        await load();
      } catch (error) {
        feedback.hidden = false;
        feedback.textContent = error?.message || "Unable to save race.";
        submit.disabled = false;
      }
    });
  };

  const load = async () => {
    page.innerHTML = '<div class="admin-race-loading" role="status">Loading race management…</div>';
    try {
      const [racePage, entries, firstUserPage] = await Promise.all([
        raceApi.getRaces("", "", 0, 100),
        raceEntryApi.getAll(),
        adminApi.users(0)
      ]);
      const races = Array.isArray(racePage) ? racePage : racePage?.content || [];
      const extraPages = Number.isInteger(firstUserPage?.totalPages) && firstUserPage.totalPages > 1
        ? await Promise.all(Array.from({ length:firstUserPage.totalPages - 1 }, (_, index) => adminApi.users(index + 1)))
        : [];
      const users = [
        ...(Array.isArray(firstUserPage) ? firstUserPage : firstUserPage?.content || []),
        ...extraPages.flatMap(item => Array.isArray(item) ? item : item?.content || [])
      ];
      const organizers = users.filter(user => Array.isArray(user.roles) && (user.roles.includes("ORGANIZER") || user.roles.includes("ADMIN")));
      const pending = (entries || []).filter(entry => String(entry.entryStatus).toUpperCase() === "PENDING");
      const camelNames = new Map();
      await Promise.all(pending.map(async entry => {
        try {
          const camel = await camelApi.one(entry.camelId);
          camelNames.set(String(entry.camelId), camel?.name || `Camel #${entry.camelId}`);
        } catch {
          camelNames.set(String(entry.camelId), `Camel #${entry.camelId}`);
        }
      }));
      current = { races, entries:entries || [], users, organizers, camelNames };
      page.innerHTML = pageDataMarkup(current);
      bindPageActions();
    } catch (error) {
      page.innerHTML = `<div class="admin-race-error"><h2>Unable to load race management</h2><p>${esc(error?.message || "Race management data could not be loaded.")}</p><button type="button" class="admin-race-primary" data-admin-race-retry>Try Again</button></div>`;
      page.querySelector("[data-admin-race-retry]")?.addEventListener("click", load);
    }
  };

  load();
}
