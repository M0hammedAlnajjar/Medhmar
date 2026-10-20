import { adminApi, camelApi } from "./api.js";
import { raceApi, raceEntryApi } from "./race-api.js";

const esc = value => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const fmtDateTime = value => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "—"
    : date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
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

function pageDataMarkup({ races, entries, users, camelNames }) {
  const userName = new Map((users || []).map(user => [String(user.userId), user.fullName]));
  const raceName = new Map((races || []).map(race => [String(race.raceId), race.name]));
  const pending = (entries || []).filter(entry => String(entry.entryStatus).toUpperCase() === "PENDING");
  const count = status => (races || []).filter(race => String(race.status).toUpperCase() === status).length;

  const raceRows = (races || []).map(race => `
    <tr>
      <td><strong>${esc(race.name)}</strong><small>Race #${esc(race.raceId)}</small></td>
      <td>${fmtDateTime(race.startsAt)}</td>
      <td>${esc(race.location)}</td>
      <td><span class="admin-race-badge ${statusTone(race.status)}">${esc(race.status)}</span></td>
      <td>${esc(userName.get(String(race.organizerId)) || `User #${race.organizerId ?? "—"}`)}</td>
      <td class="admin-race-actions">
        <button type="button" class="admin-race-action" data-admin-race-edit="${esc(race.raceId)}">Edit</button>
      </td>
    </tr>
  `).join("");

  const pendingRows = pending.map(entry => `
    <tr>
      <td>
        <strong>${esc(camelNames.get(String(entry.camelId)) || `Camel #${entry.camelId}`)}</strong>
        <small>Camel #${esc(entry.camelId)}</small>
      </td>
      <td>${esc(userName.get(String(entry.registrantId)) || `Owner #${entry.registrantId}`)}</td>
      <td>${esc(raceName.get(String(entry.raceId)) || `Race #${entry.raceId}`)}</td>
      <td>${fmtDateTime(entry.registeredAt)}</td>
      <td><span class="admin-race-badge warning">PENDING</span></td>
      <td class="admin-race-decisions">
        <button type="button" class="admin-race-approve" data-admin-entry-decision="ACCEPTED" data-entry-id="${esc(entry.entryId)}">Approve</button>
        <button type="button" class="admin-race-reject" data-admin-entry-decision="REJECTED" data-entry-id="${esc(entry.entryId)}">Reject</button>
      </td>
    </tr>
  `).join("");

  return `
    <section class="admin-race-hero">
      <div>
        <span>RACE MANAGEMENT</span>
        <h1>Race Management</h1>
        <p>Create races and review camel registration requests from owners.</p>
      </div>
      <button type="button" class="admin-race-primary" data-admin-race-create>+ Add New Race</button>
    </section>

    <section class="admin-race-metrics" aria-label="Race summary">
      <article><span>Total Races</span><strong>${races.length}</strong><small>All races in the system</small></article>
      <article><span>Open Races</span><strong>${count("OPEN")}</strong><small>Open for registration</small></article>
      <article><span>Pending Entry Requests</span><strong>${pending.length}</strong><small>Waiting for admin decision</small></article>
      <article><span>Completed Races</span><strong>${count("COMPLETED")}</strong><small>Finished races</small></article>
    </section>

    <section class="admin-race-panel">
      <div class="admin-race-panel-head">
        <div><h2>Race List</h2><p>Manage races created on Medhmar.</p></div>
      </div>
      <div class="admin-race-table-wrap">
        <table class="admin-race-table">
          <thead><tr><th>Race</th><th>Date</th><th>Location</th><th>Status</th><th>Organizer</th><th>Actions</th></tr></thead>
          <tbody>${raceRows || '<tr><td colspan="6" class="admin-race-empty">No races found.</td></tr>'}</tbody>
        </table>
      </div>
    </section>

    <section class="admin-race-panel">
      <div class="admin-race-panel-head">
        <div><h2>Pending Camel Registration Requests</h2><p>Approve or reject requests submitted by camel owners.</p></div>
        <span class="admin-race-pending-count">${pending.length} pending</span>
      </div>
      <div class="admin-race-table-wrap">
        <table class="admin-race-table">
          <thead><tr><th>Camel</th><th>Owner</th><th>Race</th><th>Submitted</th><th>Status</th><th>Decision</th></tr></thead>
          <tbody>${pendingRows || '<tr><td colspan="6" class="admin-race-empty">No pending registration requests.</td></tr>'}</tbody>
        </table>
      </div>
    </section>
  `;
}

function raceForm(race = null, organizers = []) {
  const editing = Boolean(race);
  const statuses = editing
    ? ["SCHEDULED", "OPEN", "CLOSED", "COMPLETED", "CANCELLED"]
    : ["SCHEDULED", "OPEN"];
  const options = organizers.map(user => `
    <option value="${esc(user.userId)}" ${String(user.userId) === String(race?.organizerId ?? "") ? "selected" : ""}>
      ${esc(user.fullName)} (#${esc(user.userId)})
    </option>
  `).join("");

  return `
    <div class="modal-backdrop" id="admin-race-modal">
      <div class="modal admin-race-modal" role="dialog" aria-modal="true" aria-labelledby="admin-race-modal-title">
        <div class="admin-race-modal-head">
          <div>
            <span>ADMIN RACE CONTROL</span>
            <h2 id="admin-race-modal-title">${editing ? "Edit Race" : "Add New Race"}</h2>
          </div>
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
  return `
    <section class="admin-races-page" data-admin-races>
      <div class="admin-race-loading" role="status">Loading race management…</div>
    </section>
  `;
}

export function bindAdminRaces(root = document, { notify = () => {} } = {}) {
  const page = root.querySelector("[data-admin-races]");
  if (!page || page.dataset.bound === "true") return;
  page.dataset.bound = "true";

  let current = { races: [], entries: [], users: [], organizers: [], camelNames: new Map() };

  const closeModal = () => root.querySelector("#admin-race-modal")?.remove();

  const bindPageActions = () => {
    page.querySelector("[data-admin-race-create]")?.addEventListener("click", () => {
      document.body.insertAdjacentHTML("beforeend", raceForm(null, current.organizers));
      bindModal();
    });

    page.querySelectorAll("[data-admin-race-edit]").forEach(button => {
      button.addEventListener("click", () => {
        const race = current.races.find(item => String(item.raceId) === String(button.dataset.adminRaceEdit));
        if (!race) return;
        document.body.insertAdjacentHTML("beforeend", raceForm(race, current.organizers));
        bindModal();
      });
    });

    page.querySelectorAll("[data-admin-entry-decision]").forEach(button => {
      button.addEventListener("click", async () => {
        button.disabled = true;
        try {
          await raceEntryApi.updateStatus(button.dataset.entryId, {
            entryStatus: button.dataset.adminEntryDecision
          });
          notify(`Registration ${button.dataset.adminEntryDecision.toLowerCase()}.`, "success");
          await load();
        } catch (error) {
          notify(error?.message || "Unable to update registration.", "error");
          button.disabled = false;
        }
      });
    });
  };

  const bindModal = () => {
    const modal = document.querySelector("#admin-race-modal");
    if (!modal) return;
    modal.querySelectorAll("[data-admin-race-close]").forEach(button => button.addEventListener("click", closeModal));
    modal.addEventListener("click", event => {
      if (event.target === modal) closeModal();
    });
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
        closeModal();
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
      const [racePage, entries, userPage] = await Promise.all([
        raceApi.getRaces("", "", 0, 100),
        raceEntryApi.getAll(),
        adminApi.users(0)
      ]);
      const races = Array.isArray(racePage) ? racePage : racePage?.content || [];
      const users = Array.isArray(userPage) ? userPage : userPage?.content || [];
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
      current = { races, entries: entries || [], users, organizers, camelNames };
      page.innerHTML = pageDataMarkup(current);
      bindPageActions();
    } catch (error) {
      page.innerHTML = `
        <div class="admin-race-error">
          <h2>Unable to load race management</h2>
          <p>${esc(error?.message || "Race management data could not be loaded.")}</p>
          <button type="button" class="admin-race-primary" data-admin-race-retry>Try Again</button>
        </div>
      `;
      page.querySelector("[data-admin-race-retry]")?.addEventListener("click", load);
    }
  };

  load();
}
