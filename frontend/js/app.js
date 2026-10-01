(function () {
  "use strict";

  var root = document.getElementById("app");
  var isResetPage = window.location.pathname.endsWith("/reset-password.html");
  var localHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  var apiBase = window.MEDHMAR_API_BASE || (localHost ? window.location.protocol + "//" + window.location.hostname + ":8080" : window.location.origin);
  apiBase = apiBase.replace(/\/+$/, "");
  var state = {
    view: isResetPage ? "reset" : (window.location.hash.slice(1) || "home"),
    user: null, csrf: null, notice: null,
    races: [], camels: [], trainers: [], listings: [], challenges: [], entries: [],
    agreements: [], assigned: [], trainingLogs: [], profile: null,
    selectedRaceId: null, selectedAgreementId: null, loading: false
  };
  var nav = [
    { id: "home", name: "Home", symbol: "◈" },
    { id: "races", name: "Races", symbol: "◷" },
    { id: "marketplace", name: "Marketplace", symbol: "▣" },
    { id: "agreements", name: "Partnerships", symbol: "♧", roles: ["OWNER", "ADMIN"] },
    { id: "camels", name: "My Camels", symbol: "◇" },
    { id: "trainers", name: "Trainers", symbol: "♙" },
    { id: "challenges", name: "Challenges", symbol: "◎" },
    { id: "entries", name: "My Registrations", symbol: "≡", roles: ["OWNER", "ADMIN"] },
    { id: "trainer", name: "Trainer Workspace", symbol: "◉", roles: ["TRAINER", "ADMIN"] },
    { id: "organizer", name: "Organizer Workspace", symbol: "▤", roles: ["ORGANIZER", "ADMIN"] },
    { id: "settings", name: "Account", symbol: "⚙", login: true }
  ];
  var escapeMap = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) { return escapeMap[ch]; });
  }
  function hasRole() {
    if (!state.user) return false;
    var roles = state.user.roles || [];
    return Array.prototype.some.call(arguments, function (role) { return roles.includes(role); });
  }
  function time(value) {
    if (!value) return "Not set";
    var date = new Date(value);
    return Number.isNaN(date.getTime()) ? esc(value) : esc(date.toLocaleString());
  }
  function money(value) { return Number(value || 0).toFixed(3) + " OMR"; }
  function badge(value) {
    var status = String(value || "UNKNOWN").toLowerCase();
    return '<span class="tag ' + esc(status) + '">' + esc(String(value || "Unknown").replace(/_/g, " ")) + '</span>';
  }
  function empty(text) { return '<div class="empty">' + esc(text) + '</div>'; }
  function action(label, name, id, variant) {
    return '<button type="button" class="btn small ' + esc(variant || "secondary") + '" data-action="' +
      esc(name) + '" data-id="' + esc(id) + '">' + esc(label) + '</button>';
  }
  function field(label, name, type, value, attrs) {
    var id = "f_" + name;
    var attributes = attrs || "";
    var content = type === "textarea"
      ? '<textarea id="' + id + '" name="' + name + '" ' + attributes + '>' + esc(value || "") + '</textarea>'
      : '<input id="' + id + '" name="' + name + '" type="' + (type || "text") +
        '" value="' + esc(value || "") + '" ' + attributes + '>';
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label>' + content + '</div>';
  }
  function selectField(label, name, entries, selected) {
    var opts = entries.map(function (entry) {
      return '<option value="' + esc(entry[0]) + '"' + (String(selected) === String(entry[0]) ? " selected" : "") +
        '>' + esc(entry[1]) + '</option>';
    }).join("");
    return '<div class="field"><label for="f_' + name + '">' + esc(label) + '</label><select name="' +
      name + '" id="f_' + name + '" required><option value="">Choose...</option>' + opts + '</select></div>';
  }
  function section(title, content, extra) {
    return '<section class="panel"><h2>' + esc(title) + (extra || "") + '</h2>' + content + '</section>';
  }
  function pageHeading(title, description) {
    return '<div class="page-heading"><h1>' + esc(title) + '</h1><p>' + esc(description) + '</p></div>';
  }
  function note(text, error) {
    state.notice = { text: text, error: Boolean(error) };
    render();
  }
  function noticeHtml() {
    return state.notice ? '<div role="status" class="notice' + (state.notice.error ? ' error' : '') + '">' +
      esc(state.notice.text) + '</div>' : "";
  }

  async function refreshCsrf() {
    var response = await fetch(apiBase + "/api/auth/csrf", { credentials: "include" });
    if (!response.ok) throw new Error("Could not start a secure session. Check the backend and CORS settings.");
    state.csrf = await response.json();
  }
  async function api(path, method, body) {
    var verb = method || "GET";
    var unsafe = !["GET", "HEAD", "OPTIONS"].includes(verb);
    if (unsafe && !state.csrf) await refreshCsrf();
    var headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (unsafe) headers[state.csrf.headerName] = state.csrf.token;
    var response;
    try {
      response = await fetch(apiBase + path, {
        method: verb, credentials: "include", headers: headers,
        body: body === undefined ? undefined : JSON.stringify(body)
      });
    } catch (error) {
      throw new Error("Cannot reach the backend. Verify that Spring Boot is running and the frontend origin is allowed.");
    }
    var raw = await response.text();
    var data;
    try { data = raw ? JSON.parse(raw) : null; } catch (ignored) { data = raw; }
    if (!response.ok) {
      var message = data && data.message ? data.message : "Request failed (" + response.status + ").";
      var problem = new Error(message);
      problem.status = response.status;
      throw problem;
    }
    return data;
  }
  async function loadUser() {
    try { state.user = await api("/api/users/me"); }
    catch (error) {
      if (error.status !== 401 && error.status !== 403) throw error;
      state.user = null;
    }
  }
  async function load(view) {
    if (view === "home" || view === "races" || view === "organizer") state.races = await api("/api/races") || [];
    if (view === "home" || view === "trainers" || view === "agreements") {
      state.trainers = await api("/trainer-profile/getAll") || [];
    }
    if (view === "camels" || view === "races" || view === "agreements" || view === "marketplace") {
      state.camels = await api("/camel/getAll") || [];
    }
    if (view === "marketplace") state.listings = await api("/marketplace/getAll") || [];
    if (view === "challenges") {
      var page = await api("/api/challenges?page=0&size=20");
      state.challenges = page && page.content ? page.content : [];
    }
    if (view === "entries" && state.user) {
      state.entries = await api("/api/race-entries/mine") || [];
      state.races = await api("/api/races") || [];
    }
    if (view === "agreements" && state.user) state.agreements = await api("/api/agreements/mine") || [];
    if (view === "trainer" && state.user) {
      try {
        state.profile = await api("/trainer-profile/getById?id=" + encodeURIComponent(state.user.userId));
      } catch (error) {
        if (error.status !== 404) throw error;
        state.profile = null;
      }
      state.agreements = await api("/api/agreements/mine") || [];
      state.assigned = await api("/api/agreements/assigned") || [];
      state.trainingLogs = state.selectedAgreementId
        ? (await api("/api/training-logs/agreement/" + encodeURIComponent(state.selectedAgreementId)) || [])
        : [];
    }
    if (view === "organizer" && state.user) {
      var owned = organizerRaces();
      if (!state.selectedRaceId && owned.length) state.selectedRaceId = owned[0].raceId;
      state.entries = state.selectedRaceId
        ? (await api("/api/race-entries/race/" + encodeURIComponent(state.selectedRaceId)) || [])
        : [];
    }
  }
  function organizerRaces() {
    return state.races.filter(function (race) {
      return hasRole("ADMIN") || (state.user && race.organizerId === state.user.userId);
    });
  }
  async function go(view) {
    if (isResetPage) {
      window.location.href = "./index.html#" + encodeURIComponent(view);
      return;
    }
    state.view = view;
    state.loading = true;
    window.location.hash = view;
    render();
    try {
      await load(view);
      state.loading = false;
      render();
    } catch (error) {
      state.loading = false;
      state.notice = { text: error.message, error: true };
      render();
    }
  }
  function publicHome() {
    var raceCards = state.races.slice(0, 3).map(function (race) {
      return '<article class="card"><div class="card-top">' + badge(race.status) +
        '<span class="muted">#' + esc(race.raceId) + '</span></div><h3>' + esc(race.name) + '</h3><p>' +
        esc(race.location) + ' · ' + esc(race.distanceKm) + ' km</p><p class="meta">' + time(race.startsAt) + '</p>' +
        action("View schedule", "race", race.raceId) + '</article>';
    }).join("");
    return '<section class="hero"><div><div class="eyebrow">Gulf Racing · Oman</div>' +
      '<h1>Every race. Every legacy. One destination.</h1><p>Discover camel racing, manage entries, ' +
      'build trusted partnerships and follow the community.</p><div class="actions">' +
      '<button class="btn" data-nav="races">Explore races →</button>' +
      '<button class="btn tertiary" data-nav="trainers">Find a trainer</button></div></div>' +
      '<div class="hero-art" aria-hidden="true">🐪<small>Tradition meets technology</small></div></section>' +
      '<div class="grid three kpi-row"><div class="stat-card"><div class="stat-label">Listed races</div><div class="stat-value">' +
      state.races.length + '</div><div class="stat-detail">Discover events</div></div>' +
      '<div class="stat-card"><div class="stat-label">Trainer profiles</div><div class="stat-value">' +
      state.trainers.length + '</div><div class="stat-detail">Connect with specialists</div></div>' +
      '<div class="stat-card"><div class="stat-label">Your account</div><div class="stat-value" style="font-size:21px">' +
      esc(state.user ? state.user.fullName : "Guest") + '</div><div class="stat-detail">' +
      esc(state.user ? (state.user.roles || []).join(", ") : "Sign in to participate") +
      '</div></div></div><div class="section-header"><h2>Upcoming & published races</h2>' +
      '<button class="btn tertiary small" data-nav="races">All races →</button></div>' +
      (raceCards ? '<div class="grid">' + raceCards + '</div>' : empty("No races have been published yet."));
  }
  function racesPage() {
    var selected = state.races.find(function (race) { return race.raceId === state.selectedRaceId; });
    var cards = state.races.map(function (race) {
      return '<article class="card"><div class="card-top">' + badge(race.status) +
        '<span class="muted">Race #' + esc(race.raceId) + '</span></div><h3>' + esc(race.name) + '</h3>' +
        '<p>' + esc(race.location) + ' · ' + esc(race.distanceKm) + ' km</p><p class="meta">' +
        time(race.startsAt) + '</p>' + action("View details", "race", race.raceId) + '</article>';
    }).join("");
    var detail = "";
    if (selected) {
      var choices = state.camels.map(function (c) { return [c.camelId, c.name + " (#" + c.camelId + ")"]; });
      var registration = hasRole("OWNER", "ADMIN") && selected.status === "OPEN"
        ? '<form data-form="race-register">' +
          '<input type="hidden" name="raceId" value="' + esc(selected.raceId) + '">' +
          selectField("Choose a camel you currently own", "camelId", choices) +
          '<p class="smallprint">Your ownership is verified by the server.</p>' +
          '<button class="btn" type="submit">Request registration</button></form>'
        : '<p class="smallprint">Registration requires an OWNER account and an OPEN race before its start time.</p>';
      detail = '<section class="panel" style="margin-top:18px"><h2>' + esc(selected.name) + '</h2><p>' +
        esc(selected.location) + ' · ' + time(selected.startsAt) + '</p>' + badge(selected.status) +
        '<hr><h3>Register a camel</h3>' + registration + '</section>';
    }
    return pageHeading("Race schedule", "Follow events and register a camel for open races.") +
      (cards ? '<div class="grid">' + cards + '</div>' : empty("No published races yet.")) + detail;
  }
  function camelPage() {
    var list = state.camels.map(function (camel) {
      return '<article class="card"><div class="card-top"><span class="icon-tile">♞</span>' +
        badge(camel.status) + '</div><h3>' + esc(camel.name) + '</h3><p>' +
        esc(camel.breed || "Breed not set") + ' · ' + esc(camel.gender) + '</p><p class="meta">Camel #' +
        esc(camel.camelId) + '</p>' + action("Pedigree", "pedigree", camel.camelId) + '</article>';
    }).join("");
    var form = hasRole("OWNER", "ADMIN") ? section("Add a camel",
      '<form data-form="camel-add"><div class="form-grid">' +
      field("Camel name", "name", "text", "", 'required minlength="2" maxlength="50"') +
      selectField("Gender", "gender", [["MALE", "Male"], ["FEMALE", "Female"]]) +
      field("Birth date", "birthDate", "date", "", "required") +
      field("Breed", "breed", "text", "", 'required minlength="2" maxlength="50"') +
      field("Category", "category", "text", "", 'maxlength="50"') +
      field("Photo URL (optional)", "photoUrl", "url", "", "") +
      '</div><button class="btn" type="submit">Save camel</button></form>') : "";
    return pageHeading("Camel directory", "Explore camel profiles. Authenticated owners can add their own camels.") +
      '<div class="stack">' + form + (list ? '<div class="grid">' + list + '</div>' : empty("No active camels yet.")) + '</div>';
  }
  function trainersPage() {
    var cards = state.trainers.map(function (t) {
      return '<article class="card"><div class="card-top"><span class="icon-tile">♙</span>' +
        '<span class="muted">Trainer #' + esc(t.userId) + '</span></div><h3>' + esc(t.location || "Location not set") +
        '</h3><p>' + esc(t.bio || "This trainer has not added a biography.") + '</p></article>';
    }).join("");
    return pageHeading("Trainer directory", "Discover registered trainers before creating a partnership.") +
      (cards ? '<div class="grid">' + cards + '</div>' : empty("No trainer profiles available yet."));
  }
  function marketplacePage() {
    var cards = state.listings.map(function (listing) {
      return '<article class="card"><div class="card-top">' + badge(listing.status) +
        '<span class="muted">Listing #' + esc(listing.listingId) + '</span></div>' +
        '<h3>' + money(listing.askingPriceOmr) + '</h3><p>' + esc(listing.description || "Camel listing") +
        '</p><div class="meta">Camel #' + esc(listing.camelId) + '</div>' +
        (state.user && listing.status === "AVAILABLE" ? '<form data-form="offer-add" class="actions">' +
         '<input name="listingId" type="hidden" value="' + esc(listing.listingId) + '">' +
         field("Your offer (OMR)", "offeredPriceOmr", "number", "", 'step="0.001" min="0.001" required') +
         '<button class="btn small" type="submit">Submit offer</button></form>' : "") + '</article>';
    }).join("");
    var post = hasRole("OWNER", "ADMIN") ?
      section("List a camel for sale", '<form data-form="listing-add"><div class="form-grid">' +
        selectField("Camel you fully own", "camelId", state.camels.map(function (c) { return [c.camelId, c.name + " (#" + c.camelId + ")"]; })) +
        field("Asking price (OMR)", "askingPriceOmr", "number", "", 'step="0.001" min="0.001" required') +
        field("Description", "description", "text", "", 'required minlength="3" maxlength="255"') +
        '</div><p class="smallprint">Current full ownership is enforced by the backend.</p>' +
        '<button class="btn" type="submit">Create listing</button></form>') : "";
    return pageHeading("Marketplace", "Explore listings and make verified offers.") +
      '<div class="stack">' + post + (cards ? '<div class="grid">' + cards + '</div>' : empty("No active listings.")) + '</div>';
  }
  function challengesPage() {
    var cards = state.challenges.map(function (c) {
      var animals = (c.camels || []).map(function (camel) {
        return '<div class="card" style="margin-top:9px"><strong>' + esc(camel.name) +
          '</strong><p class="meta">Votes ' + esc(camel.voteCount) + ' · ' + esc(camel.votePercent) + '%</p>' +
          (state.user && c.status === "OPEN" ? action("Vote for this camel", "vote", c.challengeId + ":" + camel.camelId) : "") +
          '</div>';
      }).join("");
      return '<article class="card"><div class="card-top">' + badge(c.status) +
        '<span class="muted">#' + esc(c.challengeId) + '</span></div><h3>' + esc(c.title) +
        '</h3><p>Voting closes ' + time(c.closesAt) + '</p>' + animals + '</article>';
    }).join("");
    return pageHeading("Audience voting", "Participate in published camel challenges. One vote per signed-in account per challenge.") +
      (cards ? '<div class="grid">' + cards + '</div>' : empty("No published challenges."));
  }
  function entriesPage() {
    var rows = state.entries.map(function (entry) {
      var race = state.races.find(function (r) { return r.raceId === entry.raceId; });
      return '<tr><td><strong>#' + esc(entry.participantNumber) + '</strong></td><td>' +
        esc(race ? race.name : ("Race #" + entry.raceId)) + '</td><td>Camel #' +
        esc(entry.camelId) + '</td><td>' + badge(entry.entryStatus) + '</td><td>' +
        time(entry.registeredAt) + '</td><td>' +
        (entry.entryStatus === "PENDING" ? action("Withdraw", "withdraw-entry", entry.entryId, "danger") : "—") +
        '</td></tr>';
    }).join("");
    return pageHeading("My registrations", "Track pending, accepted, rejected and withdrawn entries.") +
      section("Entry history", rows ? '<div class="table-wrap"><table><thead><tr><th>Number</th><th>Race</th><th>Camel</th><th>Status</th><th>Requested</th><th>Action</th></tr></thead><tbody>' +
        rows + '</tbody></table></div>' : empty("You have not registered a camel."));
  }
  function agreementTable(agreements, trainerView) {
    var rows = agreements.map(function (a) {
      var acts = a.status === "PENDING_APPROVAL" && trainerView
        ? action("Accept", "accept-agreement", a.agreementId, "") +
          " " + action("Reject", "reject-agreement", a.agreementId, "danger")
        : "";
      if ((a.status === "ACTIVE" || (a.status === "PENDING_APPROVAL" && !trainerView)) &&
          (a.ownerUserId === (state.user && state.user.userId) ||
           (trainerView && a.status === "ACTIVE"))) {
        acts += " " + action("Terminate", "terminate-agreement", a.agreementId, "danger");
      }
      return '<tr><td><strong>#' + esc(a.agreementId) + '</strong></td><td>Camel #' +
        esc(a.camelId) + '</td><td>' + esc(trainerView ? a.ownerUserId : a.trainerUserId) +
        '</td><td>' + money(a.feeOmr) + '</td><td>' + badge(a.status) +
        '</td><td><div class="inline">' + (acts || "—") + '</div></td></tr>';
    }).join("");
    return rows ? '<div class="table-wrap"><table><thead><tr><th>Agreement</th><th>Camel</th><th>' +
      (trainerView ? "Owner ID" : "Trainer ID") + '</th><th>Fee</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
      rows + '</tbody></table></div>' : empty("No agreements found.");
  }
  function agreementsPage() {
    var createForm = '<form data-form="agreement-create"><div class="form-grid">' +
      selectField("Camel you fully own", "camelId", state.camels.map(function (c) { return [c.camelId, c.name + " (#" + c.camelId + ")"]; })) +
      selectField("Designated trainer", "trainerUserId", state.trainers.map(function (t) { return [t.userId, "Trainer #" + t.userId + " · " + (t.location || "No location")]; })) +
      field("Training fee (OMR)", "feeOmr", "number", "0", 'min="0" step="0.001" required') +
      field("Prize share (%)", "prizeSharePct", "number", "0", 'min="0" max="100" step="0.01" required') +
      field("Sale share (%)", "saleSharePct", "number", "0", 'min="0" max="100" step="0.01" required') +
      field("Start date/time", "startsAt", "datetime-local", "", "required") +
      field("End date/time", "endsAt", "datetime-local", "", "required") +
      '</div><p class="smallprint">The trainer must explicitly accept this agreement before training can begin.</p>' +
      '<button class="btn" type="submit">Propose agreement</button></form>';
    return pageHeading("My partnerships", "Create a transparent agreement for a camel you fully own.") +
      '<div class="stack">' + section("New partnership", createForm) +
      section("Agreement history", agreementTable(state.agreements, false)) + '</div>';
  }
  function trainerPage() {
    var edit = state.profile ? '<form data-form="trainer-update"><div class="form-grid">' +
      field("Location", "location", "text", state.profile.location, 'maxlength="150"') +
      field("Short biography", "bio", "textarea", state.profile.bio, 'maxlength="2000"') +
      '</div><button class="btn" type="submit">Update trainer profile</button></form>'
      : '<form data-form="trainer-create"><div class="form-grid">' +
      field("Location", "location", "text", "", 'maxlength="150"') +
      field("Short biography", "bio", "textarea", "", 'maxlength="2000"') +
      '</div><button class="btn" type="submit">Create trainer profile</button></form>';
    var assigned = state.assigned.map(function (a) {
      return '<article class="card"><div class="card-top">' + badge(a.status) +
        '<span class="muted">Agreement #' + esc(a.agreementId) + '</span></div><h3>Camel #' +
        esc(a.camelId) + '</h3><p>Owner #' + esc(a.ownerUserId) + '</p>' +
        '<p class="meta">' + time(a.startsAt) + ' — ' + time(a.endsAt) + '</p>' +
        action("View training log", "show-logs", a.agreementId) + '</article>';
    }).join("");
    var logForm = state.assigned.length ? '<form data-form="training-add"><div class="form-grid">' +
      selectField("Active agreement", "agreementId", state.assigned.map(function (a) {
        return [a.agreementId, "Agreement #" + a.agreementId + " · Camel #" + a.camelId];
      }), state.selectedAgreementId) +
      field("Session date/time", "sessionAt", "datetime-local", "", "required") +
      field("Duration (minutes)", "durationMinutes", "number", "60", 'min="1" max="720" required') +
      field("Training notes", "notes", "textarea", "", 'required maxlength="2000"') +
      '</div><button class="btn" type="submit">Record training</button></form>'
      : empty("Accept a pending partnership before adding training sessions.");
    var logs = state.trainingLogs.map(function (l) {
      return '<article class="card"><h3>' + time(l.sessionAt) + '</h3><p>' + esc(l.notes) +
        '</p><span class="pill">' + esc(l.durationMinutes) + ' minutes</span></article>';
    }).join("");
    return pageHeading("Trainer workspace", "Manage your profile, accept partnerships and keep a lasting training record.") +
      '<div class="stack">' + section("Trainer profile", edit) +
      section("Partnership requests & history", agreementTable(state.agreements, true)) +
      section("Assigned camels", assigned ? '<div class="grid">' + assigned + '</div>' : empty("No active assigned camels.")) +
      section("Training log", logForm) +
      (state.selectedAgreementId ? section("Sessions for agreement #" + state.selectedAgreementId,
        logs ? '<div class="grid two">' + logs + '</div>' : empty("No training sessions recorded.")) : "") +
      '</div>';
  }
  function organizerPage() {
    var owned = organizerRaces();
    var form = '<form data-form="race-create"><div class="form-grid">' +
      field("Race name", "name", "text", "", 'required maxlength="150"') +
      field("Location", "location", "text", "", 'required maxlength="255"') +
      field("Start date/time", "startsAt", "datetime-local", "", "required") +
      field("Distance (km)", "distanceKm", "number", "", 'min="0.1" step="0.1" required') +
      selectField("Initial status", "status", [["SCHEDULED","Scheduled"],["OPEN","Open"]], "SCHEDULED") +
      '</div><button class="btn" type="submit">Create race</button></form>';
    var raceCards = owned.map(function (race) {
      return '<article class="card"><div class="card-top">' + badge(race.status) +
        '<span class="muted">#' + esc(race.raceId) + '</span></div><h3>' + esc(race.name) +
        '</h3><p>' + time(race.startsAt) + '</p><div class="actions">' +
        action("Review registrations", "choose-race", race.raceId) +
        (race.status === "SCHEDULED" ? action("Open registration", "open-race", race.raceId) : "") +
        (race.status === "OPEN" ? action("Close registration", "close-race", race.raceId) : "") +
        '</div></article>';
    }).join("");
    var selected = owned.find(function (r) { return r.raceId === state.selectedRaceId; });
    var entries = state.entries.map(function (e) {
      return '<tr><td>#' + esc(e.participantNumber) + '</td><td>Camel #' + esc(e.camelId) +
        '</td><td>User #' + esc(e.registrantId) + '</td><td>' + badge(e.entryStatus) +
        '</td><td><div class="inline">' +
        (e.entryStatus === "PENDING" ? action("Accept", "approve-entry", e.entryId) +
        action("Reject", "reject-entry", e.entryId, "danger") : "—") + '</div></td></tr>';
    }).join("");
    var resultForm = selected ? '<form data-form="result-create"><div class="form-grid">' +
      selectField("Accepted registration", "entryId", state.entries.filter(function (e) {
        return e.entryStatus === "ACCEPTED";
      }).map(function (e) { return [e.entryId, "Entry #" + e.entryId + " · Camel #" + e.camelId]; })) +
      field("Finish position", "finishPosition", "number", "", 'min="1" required') +
      field("Elapsed time (milliseconds)", "elapsedMs", "number", "", 'min="1" required') +
      '</div><button class="btn" type="submit">Publish result</button></form>' : "";
    var review = selected ? section("Registrations · " + selected.name,
      (entries ? '<div class="table-wrap"><table><thead><tr><th>Number</th><th>Camel</th><th>Registrant</th><th>Status</th><th>Decision</th></tr></thead><tbody>' +
        entries + '</tbody></table></div>' : empty("No race entries yet.")) + '<hr><h3>Publish a result</h3>' + resultForm)
      : empty("Choose a race to review its entries.");
    return pageHeading("Organizer workspace", "Manage race schedules, approve entries and publish verified results.") +
      '<div class="stack">' + section("Create race", form) +
      section("Your races", raceCards ? '<div class="grid">' + raceCards + '</div>' : empty("No assigned races.")) +
      review + '</div>';
  }
  function settingsPage() {
    var me = state.user;
    return pageHeading("Account settings", "Manage your display details and language preference.") +
      section("Account profile", '<p class="smallprint">' + esc(me.email) + ' · User #' + esc(me.userId) +
      ' · ' + esc((me.roles || []).join(", ")) + '</p>' +
      '<form data-form="profile-update"><div class="form-grid">' +
      field("Full name", "fullName", "text", me.fullName, 'required maxlength="150"') +
      selectField("Preferred language", "preferredLanguage", [["en","English"],["ar","العربية"]], me.preferredLanguage) +
      field("Avatar URL (optional)", "avatarUrl", "url", me.avatarUrl, 'maxlength="2048"') +
      '</div><button type="submit" class="btn">Save settings</button></form><hr>' +
      '<button class="btn danger" data-action="logout">Sign out</button>');
  }
  function authPage(view) {
    var register = view === "register", forgot = view === "forgot";
    var fields = forgot ? field("Email", "email", "email", "", 'required autocomplete="email"')
      : (register ? field("Full name", "fullName", "text", "", 'required maxlength="150"') : "") +
        field("Email", "email", "email", "", 'required autocomplete="email"') +
        field("Password", "password", "password", "", 'required minlength="12" autocomplete="' +
          (register ? "new-password" : "current-password") + '"') +
        (register ? selectField("Language", "preferredLanguage", [["en","English"],["ar","العربية"]], "en") : "");
    var headline = register ? "Create your account" : (forgot ? "Reset request" : "Welcome back");
    var title = forgot ? "We will send a password reset link if the account is eligible."
      : (register ? "Start your Gulf Racing journey." : "Sign in to manage your racing world.");
    return '<div class="auth-wrap"><div class="auth-brand"><div class="brand-icon">🐪</div>' +
      '<h1>' + headline + '</h1><p>' + title + '</p></div><section class="panel">' +
      '<form data-form="' + view + '">' + fields +
      '<button class="btn" type="submit">' + (register ? "Create account" : forgot ? "Request reset" : "Sign in") +
      '</button></form>' + (!forgot && !register ? '<hr><div class="actions"><button class="btn secondary" data-action="google-login">Continue with Google</button></div>' : "") +
      '<hr><div class="inline"><button class="btn tertiary small" data-nav="signin">Sign in</button>' +
      '<button class="btn tertiary small" data-nav="register">Create account</button>' +
      '<button class="btn tertiary small" data-nav="forgot">Forgot password?</button></div>' +
      '<p class="smallprint">Google login requires the backend Google profile and OAuth credentials.</p></section></div>';
  }
  function resetPage() {
    return '<div class="auth-wrap"><div class="auth-brand"><div class="brand-icon">🐪</div>' +
      '<h1>Choose a new password</h1><p>Reset links expire after 30 minutes and can be used only once.</p></div>' +
      '<section class="panel"><form data-form="reset">' +
      field("New password (12+ characters)", "password", "password", "", 'required minlength="12" autocomplete="new-password"') +
      '<button type="submit" class="btn">Reset password</button></form>' +
      '<hr><a class="btn tertiary" href="./index.html#signin">Return to sign in</a></section></div>';
  }

  function content() {
    if (isResetPage) return resetPage();
    if (!state.user && ["entries","agreements","trainer","organizer","settings"].includes(state.view)) {
      return authPage("signin");
    }
    switch (state.view) {
      case "home": return publicHome();
      case "races": return racesPage();
      case "camels": return camelPage();
      case "trainers": return trainersPage();
      case "marketplace": return marketplacePage();
      case "challenges": return challengesPage();
      case "entries": return entriesPage();
      case "agreements": return agreementsPage();
      case "trainer": return trainerPage();
      case "organizer": return organizerPage();
      case "settings": return settingsPage();
      case "signin": case "register": case "forgot": return authPage(state.view);
      default: return publicHome();
    }
  }
  function render() {
    if (!root) return;
    if (isResetPage) {
      root.innerHTML = '<div class="main-area">' + noticeHtml() + content() + '</div>';
      return;
    }
    var links = nav.filter(function (item) {
      if (item.login && !state.user) return false;
      return !item.roles || item.roles.some(function (role) { return hasRole(role); });
    }).map(function (item) {
      return '<button class="nav-btn' + (state.view === item.id ? ' active' : '') +
        '" data-nav="' + item.id + '"><span class="symbol">' + item.symbol +
        '</span>' + esc(item.name) + '</button>';
    }).join("");

    root.innerHTML = '<div class="app-shell">' +
      '<header class="site-header"><div class="header-inner">' +
      '<div class="brand"><div class="brand-icon" aria-hidden="true">🐪</div>' +
      '<div><div class="brand-name">GULF RACING</div><div class="brand-sub">Medhmar Platform</div></div></div>' +
      '<nav class="nav-links" aria-label="Main navigation">' + links + '</nav>' +
      '<div class="user-actions">' +
      (state.user ? '<span class="avatar" title="' + esc(state.user.fullName) + '">' +
      esc((state.user.fullName || "?").charAt(0).toUpperCase()) + '</span>'
      : '<button class="btn secondary small" data-nav="signin">Sign in</button>' +
      '<button class="btn small" data-nav="register">Join now</button>') +
      '</div></div>' +
      '<div class="workspace-strip"><div class="workspace-inner">' +
      '<div class="breadcrumb">GULF RACING / <strong>' +
      esc(state.view.replace(/-/g, " ").toUpperCase()) + '</strong></div>' +
      '<span class="pill">● ' + (state.user ? "Session active" : "Public access") + '</span>' +
      '</div></div></header>' +
      '<main class="main-area">' +
      noticeHtml() + (state.loading ? '<p class="boot-message">Loading this workspace...</p>' : content()) +
      '<div class="footer">© Medhmar · Gulf Racing Platform · Desktop MVP</div></main></div>';
  }
  function formData(form) {
    return new FormData(form);
  }
  function toIso(value) {
    var parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new Error("Enter a valid date and time.");
    return parsed.toISOString();
  }
  async function submit(name, f) {
    var data = formData(f);
    function val(key) { return String(data.get(key) || "").trim(); }
    function number(key) { return Number(val(key)); }
    switch (name) {
      case "signin":
        await api("/api/auth/login", "POST", { email: val("email"), password: String(data.get("password") || "") });
        state.csrf = null;
        await refreshCsrf();
        await loadUser();
        state.notice = { text: "Signed in successfully.", error: false };
        await go("home");
        break;
      case "register":
        await api("/api/auth/register", "POST", {
          fullName: val("fullName"), email: val("email"),
          password: String(data.get("password") || ""), preferredLanguage: val("preferredLanguage")
        });
        state.notice = { text: "Account created. Sign in to continue.", error: false };
        await go("signin");
        break;
      case "forgot":
        await api("/api/auth/forgot-password", "POST", { email: val("email") });
        note("If the account is eligible, a password reset email will be sent.");
        break;
      case "reset": {
        var token = window.location.hash.replace(/^#token=/, "");
        if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error("This reset link is invalid or missing.");
        await api("/api/auth/reset-password", "POST", {
          token: token, password: String(data.get("password") || "")
        });
        window.history.replaceState(null, "", window.location.pathname);
        state.notice = { text: "Password updated. Return to sign in.", error: false };
        render();
        break;
      }
      case "profile-update":
        state.user = await api("/api/users/me", "PUT", {
          fullName: val("fullName"), preferredLanguage: val("preferredLanguage"),
          avatarUrl: val("avatarUrl") || null
        });
        note("Account settings updated.");
        break;
      case "camel-add":
        await api("/camel/add", "POST", {
          name: val("name"), gender: val("gender"), birthDate: toIso(val("birthDate")),
          breed: val("breed"), category: val("category") || null,
          photoUrl: val("photoUrl") || null, status: "ACTIVE"
        });
        state.notice = { text: "Camel created and ownership recorded.", error: false };
        await go("camels");
        break;
      case "race-register":
        await api("/api/race-entries", "POST", { raceId: number("raceId"), camelId: number("camelId") });
        state.notice = { text: "Registration requested. The organizer will review it.", error: false };
        await go("entries");
        break;
      case "listing-add":
        await api("/marketplace/add", "POST", {
          camelId: number("camelId"), askingPriceOmr: number("askingPriceOmr"), description: val("description")
        });
        state.notice = { text: "Listing created.", error: false };
        await go("marketplace");
        break;
      case "offer-add":
        await api("/offer/add", "POST", { listingId: number("listingId"), offeredPriceOmr: number("offeredPriceOmr") });
        state.notice = { text: "Your offer was submitted.", error: false };
        await go("marketplace");
        break;
      case "agreement-create":
        await api("/api/agreements", "POST", {
          camelId: number("camelId"), trainerUserId: number("trainerUserId"),
          feeOmr: number("feeOmr"), prizeSharePct: number("prizeSharePct"), saleSharePct: number("saleSharePct"),
          startsAt: toIso(val("startsAt")), endsAt: toIso(val("endsAt"))
        });
        state.notice = { text: "Partnership proposal sent to the trainer.", error: false };
        await go("agreements");
        break;
      case "trainer-create":
      case "trainer-update":
        await api("/trainer-profile/" + (name === "trainer-create" ? "add" : "update"),
          name === "trainer-create" ? "POST" : "PUT",
          { bio: val("bio"), location: val("location") });
        state.notice = { text: "Trainer profile saved.", error: false };
        await go("trainer");
        break;
      case "training-add":
        await api("/api/training-logs", "POST", {
          agreementId: number("agreementId"), sessionAt: toIso(val("sessionAt")),
          durationMinutes: number("durationMinutes"), notes: val("notes")
        });
        state.selectedAgreementId = number("agreementId");
        state.notice = { text: "Training session recorded.", error: false };
        await go("trainer");
        break;
      case "race-create":
        await api("/api/races", "POST", {
          name: val("name"), location: val("location"), startsAt: toIso(val("startsAt")),
          distanceKm: number("distanceKm"), status: val("status"), organizerId: state.user.userId
        });
        state.notice = { text: "Race created.", error: false };
        await go("organizer");
        break;
      case "result-create":
        await api("/api/race-results", "POST", {
          entryId: number("entryId"), finishPosition: number("finishPosition"), elapsedMs: number("elapsedMs")
        });
        state.notice = { text: "Race result published.", error: false };
        await go("organizer");
        break;
      default: throw new Error("Unknown form.");
    }
  }
  async function handleAction(button) {
    var id = button.dataset.id || "";
    var kind = button.dataset.action;
    if (kind === "google-login") { window.location.assign(apiBase + "/oauth2/authorization/google"); return; }
    if (kind === "race") { state.selectedRaceId = Number(id); await go("races"); return; }
    if (kind === "choose-race") { state.selectedRaceId = Number(id); await go("organizer"); return; }
    if (kind === "show-logs") { state.selectedAgreementId = Number(id); await go("trainer"); return; }
    if (kind === "logout") {
      await api("/api/auth/logout", "POST");
      state.user = null; state.csrf = null; state.selectedRaceId = null; state.selectedAgreementId = null;
      state.notice = { text: "You have signed out.", error: false };
      await go("home");
      return;
    }
    if (kind === "pedigree") {
      var pedigree = await api("/camel/" + encodeURIComponent(id) + "/pedigree/tree?generations=3");
      state.notice = { text: "Pedigree: " + JSON.stringify(pedigree).slice(0, 650), error: false };
      render();
      return;
    }
    if (kind === "vote") {
      var parts = id.split(":");
      await api("/api/challenges/" + encodeURIComponent(parts[0]) + "/votes", "POST", { camelId: Number(parts[1]) });
      state.notice = { text: "Your vote was recorded.", error: false };
      await go("challenges");
      return;
    }
    if (kind === "withdraw-entry") {
      if (!window.confirm("Withdraw this pending registration?")) return;
      await api("/api/race-entries/" + encodeURIComponent(id), "DELETE");
      state.notice = { text: "Registration withdrawn; history retained.", error: false };
      await go("entries");
      return;
    }
    var agreementPaths = {
      "accept-agreement": "accept", "reject-agreement": "reject", "terminate-agreement": "terminate"
    };
    if (agreementPaths[kind]) {
      if (kind === "terminate-agreement" && !window.confirm("Terminate this agreement?")) return;
      await api("/api/agreements/" + encodeURIComponent(id) + "/" + agreementPaths[kind], "POST");
      state.notice = { text: "Agreement updated.", error: false };
      await go(state.view);
      return;
    }
    if (kind === "approve-entry" || kind === "reject-entry") {
      await api("/api/race-entries/" + encodeURIComponent(id), "PUT", {
        entryStatus: kind === "approve-entry" ? "ACCEPTED" : "REJECTED"
      });
      state.notice = { text: "Registration decision saved.", error: false };
      await go("organizer");
      return;
    }
    if (kind === "open-race" || kind === "close-race") {
      var race = state.races.find(function (r) { return r.raceId === Number(id); });
      if (!race) throw new Error("Race could not be found.");
      await api("/api/races/" + encodeURIComponent(id), "PUT", {
        raceId: race.raceId, name: race.name, location: race.location, startsAt: race.startsAt,
        distanceKm: race.distanceKm, organizerId: race.organizerId,
        status: kind === "open-race" ? "OPEN" : "CLOSED", resultsImageUrl: race.resultsImageUrl || null
      });
      state.notice = { text: "Race status updated.", error: false };
      await go("organizer");
    }
  }
  root.addEventListener("click", async function (event) {
    var button = event.target.closest("[data-nav], [data-action]");
    if (!button) return;
    button.disabled = true;
    try {
      if (button.dataset.nav) await go(button.dataset.nav);
      else await handleAction(button);
    } catch (error) {
      state.notice = { text: error.message, error: true };
      render();
    } finally { if (button.isConnected) button.disabled = false; }
  });
  root.addEventListener("submit", async function (event) {
    var form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();
    var submitter = form.querySelector('[type="submit"]');
    if (submitter) submitter.disabled = true;
    try {
      await submit(form.dataset.form, form);
    } catch (error) {
      state.notice = { text: error.message, error: true };
      render();
    } finally { if (submitter && submitter.isConnected) submitter.disabled = false; }
  });
  async function init() {
    render();
    try {
      if (!isResetPage) {
        await loadUser();
        await go(state.view);
      } else render();
    } catch (error) { state.notice = { text: error.message, error: true }; render(); }
  }
  init();
})();
