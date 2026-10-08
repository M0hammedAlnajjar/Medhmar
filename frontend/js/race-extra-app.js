import { camelApi } from "./api.js";
import {
    raceApi,
    raceEntryApi,
    raceResultApi
} from "./race-api.js";

const HERO_IMAGE = "/assets/racing-hero.webp";

const DEMO_RACES = [
    {
        raceId: "demo-nizwa",
        name: "Nizwa Heritage Race",
        startsAt: "2026-10-18T03:30:00Z",
        location: "Nizwa, Oman",
        distanceKm: 6,
        status: "SCHEDULED",
        organizerId: null,
        organizationId: null
    },
    {
        raceId: "demo-salalah",
        name: "Salalah Summer Race",
        startsAt: "2026-10-25T02:00:00Z",
        location: "Salalah, Oman",
        distanceKm: 8,
        status: "SCHEDULED",
        organizerId: null,
        organizationId: null
    },
    {
        raceId: "demo-alwusta",
        name: "Al Wusta Desert Challenge",
        startsAt: "2026-11-02T03:00:00Z",
        location: "Haima, Oman",
        distanceKm: 7,
        status: "SCHEDULED",
        organizerId: null,
        organizationId: null
    },
    {
        raceId: "demo-muscat",
        name: "Muscat Desert Sprint",
        startsAt: "2026-10-10T03:00:00Z",
        location: "Muscat, Oman",
        distanceKm: 5,
        status: "OPEN",
        organizerId: null,
        organizationId: null
    },
    {
        raceId: "demo-sohar",
        name: "Sohar Heritage Cup",
        startsAt: "2026-09-28T03:00:00Z",
        location: "Sohar, Oman",
        distanceKm: 7,
        status: "COMPLETED",
        organizerId: null,
        organizationId: null
    }
];

const DEMO_RESULTS = {
    "demo-sohar": [
        {
            entryId: "demo-result-1",
            participantNumber: 11,
            camelName: "Al Shamal",
            finishPosition: 1,
            elapsedMs: 413000
        },
        {
            entryId: "demo-result-2",
            participantNumber: 7,
            camelName: "Barq",
            finishPosition: 2,
            elapsedMs: 419000
        },
        {
            entryId: "demo-result-3",
            participantNumber: 3,
            camelName: "Sahab",
            finishPosition: 3,
            elapsedMs: 426000
        }
    ]
};

const DEMO_OWNER_CAMELS = [
    {
        camelId: "demo-camel-a",
        name: "Al Wathba",
        breed: "Omani",
        gender: "Male",
        category: "Racing",
        status: "ACTIVE",
        photoUrl: "/assets/mock-camels/camel-1.jpg"
    },
    {
        camelId: "demo-camel-b",
        name: "Shaheen",
        breed: "Omani",
        gender: "Male",
        category: "Racing",
        status: "ACTIVE",
        photoUrl: "/assets/mock-camels/camel-2.jpg"
    }
];

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDate(value) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(new Date(value));
}

function formatTime(value) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(value));
}

function formatDuration(value) {
    const total = Number(value || 0);
    if (!total) return "—";
    const minutes = Math.floor(total / 60000);
    const seconds = Math.floor((total % 60000) / 1000);
    const millis = total % 1000;
    return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function toDateTimeLocal(value) {
    if (!value) return "";
    const date = new Date(value);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
}

function isDemoRace(raceId) {
    return String(raceId).startsWith("demo-");
}

function demoRace(raceId) {
    return DEMO_RACES.find(
        race => String(race.raceId) === String(raceId)
    );
}

function navigate(path) {
    history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
}

function statusClass(status) {
    const value = String(status || "").toUpperCase();
    if (value === "OPEN") return "open";
    if (value === "SCHEDULED") return "upcoming";
    if (value === "COMPLETED") return "completed";
    if (value === "CLOSED") return "closed";
    if (value === "CANCELLED") return "cancelled";
    return "neutral";
}

function entryStatusClass(status) {
    const value = String(status || "").toUpperCase();
    if (value === "ACCEPTED") return "accepted";
    if (value === "PENDING") return "pending";
    if (value === "REJECTED") return "rejected";
    if (value === "WITHDRAWN") return "withdrawn";
    return "neutral";
}

function pageLoading(container, text = "Loading...") {
    container.innerHTML = `
      <section class="medhmar-races-page">
        <div class="medhmar-race-state">
          <div class="medhmar-race-loader"></div>
          <h2>${escapeHtml(text)}</h2>
        </div>
      </section>
    `;
}

function pageState(container, title, message, actionPath = "/races", actionLabel = "Back to Races") {
    container.innerHTML = `
      <section class="medhmar-races-page">
        <div class="medhmar-race-state">
          <div class="medhmar-state-icon">!</div>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(message)}</p>
          <button type="button" class="medhmar-view-race" data-state-action>
            ${escapeHtml(actionLabel)}
          </button>
        </div>
      </section>
    `;
    container.querySelector("[data-state-action]")?.addEventListener(
        "click",
        () => navigate(actionPath)
    );
}

async function getRace(raceId) {
    const sample = demoRace(raceId);
    if (sample) return sample;
    return raceApi.getRaceById(raceId);
}

async function getAllBackendRaces() {
    const response = await raceApi.getRaces("", "", 0, 100);
    return Array.isArray(response) ? response : response?.content || [];
}

function raceTabs(raceId, active) {
    const id = encodeURIComponent(raceId);
    const tabs = [
        ["overview", "Overview", `/races/${id}`],
        ["participants", "Participants", `/races/${id}/participants`],
        ["results", "Results", `/races/${id}/results`]
    ];

    return `
      <div class="medhmar-detail-tabs">
        ${tabs.map(([key, label, path]) => `
          <button
            type="button"
            class="${active === key ? "active" : ""}"
            data-race-tab="${escapeHtml(path)}"
          >
            ${label}
          </button>
        `).join("")}
      </div>
    `;
}

function bindRaceTabs(container) {
    container.querySelectorAll("[data-race-tab]").forEach(button => {
        button.addEventListener("click", () => {
            navigate(button.dataset.raceTab);
        });
    });
}

function raceSummary(race) {
    return `
      <div class="medhmar-participants-race-info">
        <div><span>Date</span><strong>${formatDate(race.startsAt)}</strong></div>
        <div><span>Time</span><strong>${formatTime(race.startsAt)}</strong></div>
        <div><span>Location</span><strong>${escapeHtml(race.location)}</strong></div>
        <div><span>Distance</span><strong>${escapeHtml(race.distanceKm)} KM</strong></div>
      </div>
    `;
}

async function safeCamel(camelId) {
    try {
        return await camelApi.one(camelId);
    } catch {
        return null;
    }
}

async function safeRace(raceId) {
    try {
        return await raceApi.getRaceById(raceId);
    } catch {
        return null;
    }
}

async function loadRaceResults(raceId) {
    if (isDemoRace(raceId)) {
        return {
            rows: DEMO_RESULTS[raceId] || [],
            restricted: false
        };
    }

    let entries;
    try {
        entries = await raceEntryApi.getForRace(raceId);
    } catch (error) {
        if (error?.status === 401 || error?.status === 403) {
            return { rows: [], restricted: true };
        }
        throw error;
    }

    const accepted = (entries || []).filter(
        entry => String(entry.entryStatus).toUpperCase() === "ACCEPTED"
    );

    const rows = (
        await Promise.all(
            accepted.map(async entry => {
                try {
                    const result = await raceResultApi.getByEntryId(entry.entryId);
                    const camel = await safeCamel(entry.camelId);
                    return {
                        ...result,
                        participantNumber: entry.participantNumber,
                        camelName: camel?.name || `Camel #${entry.camelId}`
                    };
                } catch (error) {
                    if (error?.status === 404) return null;
                    throw error;
                }
            })
        )
    ).filter(Boolean);

    rows.sort(
        (a, b) =>
            Number(a.finishPosition) - Number(b.finishPosition)
    );

    return { rows, restricted: false };
}

export async function renderRaceResults(container, raceId) {
    pageLoading(container, "Loading race results...");

    try {
        const race = await getRace(raceId);
        const { rows, restricted } = await loadRaceResults(raceId);

        container.innerHTML = `
          <section class="medhmar-race-workflow">
            <button type="button" class="medhmar-back-races" data-back-race>
              ← Back to Race
            </button>

            <div class="medhmar-participants-heading">
              <div>
                <div class="medhmar-detail-title">
                  <h1>Race Results</h1>
                  <span class="medhmar-race-status ${statusClass(race.status)}">
                    ${escapeHtml(race.status)}
                  </span>
                </div>
                <p>${escapeHtml(race.name)}</p>
              </div>
            </div>

            ${raceSummary(race)}
            ${raceTabs(raceId, "results")}

            <section class="medhmar-workflow-card">
              <div class="medhmar-participants-card-head">
                <div>
                  <h2>Official Results</h2>
                  <p>Finish positions and recorded elapsed times.</p>
                </div>
              </div>

              ${rows.length ? `
                <div class="medhmar-participants-table-wrap">
                  <table class="medhmar-participants-table">
                    <thead>
                      <tr>
                        <th>Position</th>
                        <th>Participant</th>
                        <th>Camel</th>
                        <th>Elapsed Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rows.map(row => `
                        <tr>
                          <td><strong>#${escapeHtml(row.finishPosition)}</strong></td>
                          <td>#${escapeHtml(row.participantNumber)}</td>
                          <td><strong>${escapeHtml(row.camelName)}</strong></td>
                          <td>${formatDuration(row.elapsedMs)}</td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
              ` : `
                <div class="medhmar-participants-empty">
                  <div class="medhmar-state-icon">🏁</div>
                  <h3>${restricted ? "Detailed Results Restricted" : "No Results Yet"}</h3>
                  <p>
                    ${restricted
                        ? "Detailed result rows require organizer access with the current backend API."
                        : "Official results have not been recorded for this race yet."}
                  </p>
                </div>
              `}

              ${race.resultsImageUrl ? `
                <div class="medhmar-result-image">
                  <h3>Published Results Image</h3>
                  <img src="${escapeHtml(race.resultsImageUrl)}" alt="Published race results">
                </div>
              ` : ""}
            </section>
          </section>
        `;

        container.querySelector("[data-back-race]")?.addEventListener(
            "click",
            () => navigate(`/races/${encodeURIComponent(raceId)}`)
        );
        bindRaceTabs(container);
    } catch (error) {
        pageState(
            container,
            "Unable to load results",
            error?.message || "Race results could not be loaded.",
            `/races/${encodeURIComponent(raceId)}`,
            "Back to Race"
        );
    }
}

export async function renderRaceRegistration(container, raceId) {
    pageLoading(container, "Loading registration...");

    try {
        const race = await getRace(raceId);
        const demo = isDemoRace(raceId);

        if (String(race.status).toUpperCase() !== "OPEN") {
            pageState(
                container,
                "Registration Closed",
                "Camel registration is available only while the race status is OPEN.",
                `/races/${encodeURIComponent(raceId)}`,
                "Back to Race"
            );
            return;
        }

        let camels;
        try {
            camels = demo ? DEMO_OWNER_CAMELS : await camelApi.mine();
        } catch (error) {
            if (error?.status === 401) {
                pageState(
                    container,
                    "Sign In Required",
                    "Sign in with an owner account to register a camel.",
                    "/signin",
                    "Sign In"
                );
                return;
            }
            throw error;
        }

        const available = (camels || []).filter(
            camel => String(camel.status).toUpperCase() === "ACTIVE"
        );

        container.innerHTML = `
          <section class="medhmar-race-workflow medhmar-registration-page">
            <button type="button" class="medhmar-back-races" data-back-race>
              ← Back to Race
            </button>

            <div class="medhmar-registration-heading">
              <div>
                <h1>Register for ${escapeHtml(race.name)}</h1>
                <p>Select one of your active camels to enter this race.</p>
              </div>
              <span class="medhmar-race-status open medhmar-static-status">OPEN</span>
            </div>

            ${raceSummary(race)}

            <section class="medhmar-workflow-card medhmar-registration-card">
              <form id="race-registration-form" class="medhmar-registration-form">
                <fieldset class="medhmar-camel-choice-list" ${available.length ? "" : "disabled"}>
                  <legend>Select Your Camel</legend>

                  ${available.length ? available.map((camel, index) => `
                    <label class="medhmar-camel-choice">
                      <input
                        type="radio"
                        name="camelId"
                        value="${escapeHtml(camel.camelId)}"
                        ${index === 0 ? "checked" : ""}
                        required
                      >
                      <span class="medhmar-camel-radio" aria-hidden="true"></span>
                      <img
                        src="${escapeHtml(camel.photoUrl || "/assets/racing-hero.webp")}"
                        alt="${escapeHtml(camel.name)}"
                      >
                      <span class="medhmar-camel-choice-copy">
                        <strong>${escapeHtml(camel.name)}</strong>
                        <span>
                          ${escapeHtml(camel.gender || "Camel")}
                          ·
                          ${escapeHtml(camel.breed || "Breed not listed")}
                          ${camel.category ? ` · ${escapeHtml(camel.category)}` : ""}
                        </span>
                      </span>
                    </label>
                  `).join("") : `
                    <div class="medhmar-registration-empty">
                      <div class="medhmar-state-icon">🐪</div>
                      <strong>No Active Camels</strong>
                      <span>Add or activate a camel before registering for this race.</span>
                    </div>
                  `}
                </fieldset>

                <div class="medhmar-form-note">
                  New registrations start with PENDING status and must be reviewed by the race organizer.
                </div>

                <div class="medhmar-form-feedback" id="race-registration-feedback" hidden></div>

                <div class="medhmar-registration-actions">
                  <button type="button" class="medhmar-outline-action" data-cancel-registration>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="medhmar-view-race"
                    ${available.length ? "" : "disabled"}
                  >
                    ${demo ? "Preview Registration" : "Submit Registration"}
                  </button>
                </div>
              </form>
            </section>
          </section>
        `;

        const backToRace = () =>
            navigate(`/races/${encodeURIComponent(raceId)}`);

        container.querySelector("[data-back-race]")?.addEventListener(
            "click",
            backToRace
        );

        container.querySelector("[data-cancel-registration]")?.addEventListener(
            "click",
            backToRace
        );

        container.querySelector("#race-registration-form")?.addEventListener(
            "submit",
            async event => {
                event.preventDefault();
                const form = event.currentTarget;
                const button = form.querySelector('[type="submit"]');
                const feedback = container.querySelector("#race-registration-feedback");
                const data = new FormData(form);
                const camelId = data.get("camelId");

                button.disabled = true;
                feedback.hidden = false;

                try {
                    if (demo) {
                        feedback.className = "medhmar-form-feedback success";
                        feedback.textContent =
                            "Preview only: demo races do not create backend registrations.";
                        return;
                    }

                    const created = await raceEntryApi.create({
                        raceId: Number(raceId),
                        camelId: Number(camelId)
                    });

                    feedback.className = "medhmar-form-feedback success";
                    feedback.textContent =
                        `Registration #${created.entryId} submitted with ${created.entryStatus} status.`;
                    form.reset();
                } catch (error) {
                    feedback.className = "medhmar-form-feedback error";
                    feedback.textContent =
                        error?.message || "Unable to register this camel.";
                } finally {
                    button.disabled = false;
                }
            }
        );
    } catch (error) {
        pageState(
            container,
            "Unable to load registration",
            error?.message || "Registration could not be loaded.",
            `/races/${encodeURIComponent(raceId)}`,
            "Back to Race"
        );
    }
}

export async function renderMyRegistrations(container) {
    pageLoading(container, "Loading your registrations...");

    try {
        const entries = await raceEntryApi.getMine();
        const registrations = await Promise.all(
            (entries || []).map(enrichRegistration)
        );

        container.innerHTML = `
          <section class="medhmar-race-workflow">
            <div class="medhmar-workflow-heading">
              <div>
                <h1>My Registrations</h1>
                <p>Track your camel race registrations and their current status.</p>
              </div>
              <button type="button" class="medhmar-outline-action" data-browse-races>
                Browse Races
              </button>
            </div>

            <section class="medhmar-workflow-card">
              ${registrations.length ? `
                <div class="medhmar-participants-table-wrap">
                  <table class="medhmar-participants-table">
                    <thead>
                      <tr>
                        <th>Race</th>
                        <th>Camel</th>
                        <th>Participant #</th>
                        <th>Registered</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${registrations.map(item => `
                        <tr>
                          <td>
                            <strong>${escapeHtml(item.raceName)}</strong>
                            <div class="medhmar-table-subtext">${formatDate(item.raceStartsAt)}</div>
                          </td>
                          <td>${escapeHtml(item.camelName)}</td>
                          <td>#${escapeHtml(item.participantNumber)}</td>
                          <td>${formatDate(item.registeredAt)}</td>
                          <td>
                            <span class="medhmar-entry-status ${entryStatusClass(item.entryStatus)}">
                              ${escapeHtml(item.entryStatus)}
                            </span>
                          </td>
                          <td>
                            ${String(item.entryStatus).toUpperCase() === "PENDING" ? `
                              <button
                                type="button"
                                class="medhmar-table-action danger"
                                data-withdraw-entry="${escapeHtml(item.entryId)}"
                              >
                                Withdraw
                              </button>
                            ` : "—"}
                          </td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
              ` : `
                <div class="medhmar-participants-empty">
                  <div class="medhmar-state-icon">🐪</div>
                  <h3>No Registrations Yet</h3>
                  <p>Open races will appear here after you register one of your camels.</p>
                </div>
              `}
            </section>
          </section>
        `;

        container.querySelector("[data-browse-races]")?.addEventListener(
            "click",
            () => navigate("/races")
        );

        container.querySelectorAll("[data-withdraw-entry]").forEach(button => {
            button.addEventListener("click", async () => {
                button.disabled = true;
                try {
                    await raceEntryApi.withdraw(button.dataset.withdrawEntry);
                    await renderMyRegistrations(container);
                } catch (error) {
                    pageState(
                        container,
                        "Unable to withdraw registration",
                        error?.message || "The registration could not be withdrawn.",
                        "/registrations",
                        "Try Again"
                    );
                }
            });
        });
    } catch (error) {
        if (error?.status === 401) {
            pageState(
                container,
                "Sign In Required",
                "Sign in to view your race registrations.",
                "/signin",
                "Sign In"
            );
            return;
        }

        pageState(
            container,
            "Unable to load registrations",
            error?.message || "Your registrations could not be loaded."
        );
    }
}

export async function renderRaceArchive(container) {
    pageLoading(container, "Loading race archive...");

    try {
        const backend = await getAllBackendRaces();
        const races = [
            ...backend,
            ...DEMO_RACES
        ].filter(race =>
            ["COMPLETED", "CANCELLED"].includes(
                String(race.status).toUpperCase()
            )
        );

        races.sort(
            (a, b) =>
                new Date(b.startsAt).getTime() -
                new Date(a.startsAt).getTime()
        );

        container.innerHTML = `
          <section class="medhmar-race-workflow">
            <div class="medhmar-workflow-heading">
              <div>
                <h1>Race Archive</h1>
                <p>Completed and cancelled races from MEDHMAR.</p>
              </div>
              <button type="button" class="medhmar-outline-action" data-current-races>
                Current Races
              </button>
            </div>

            <div class="medhmar-archive-grid">
              ${races.length ? races.map(race => `
                <article class="medhmar-archive-card">
                  <img src="${HERO_IMAGE}" alt="">
                  <div class="medhmar-archive-body">
                    <div class="medhmar-archive-title">
                      <h2>${escapeHtml(race.name)}</h2>
                      <span class="medhmar-race-status ${statusClass(race.status)}">
                        ${escapeHtml(race.status)}
                      </span>
                    </div>
                    <p>${formatDate(race.startsAt)} · ${escapeHtml(race.location)}</p>
                    <div class="medhmar-archive-meta">
                      <span>${escapeHtml(race.distanceKm)} KM</span>
                      <span>Race #${escapeHtml(race.raceId)}</span>
                    </div>
                    <button
                      type="button"
                      class="medhmar-view-race"
                      data-archive-race="${escapeHtml(race.raceId)}"
                    >
                      View Race
                    </button>
                  </div>
                </article>
              `).join("") : `
                <div class="medhmar-race-state">
                  <div class="medhmar-state-icon">🏁</div>
                  <h2>No Archived Races</h2>
                  <p>Completed and cancelled races will appear here.</p>
                </div>
              `}
            </div>
          </section>
        `;

        container.querySelector("[data-current-races]")?.addEventListener(
            "click",
            () => navigate("/races")
        );
        container.querySelectorAll("[data-archive-race]").forEach(button => {
            button.addEventListener(
                "click",
                () => navigate(
                    `/races/${encodeURIComponent(button.dataset.archiveRace)}`
                )
            );
        });
    } catch (error) {
        pageState(
            container,
            "Unable to load archive",
            error?.message || "The race archive could not be loaded."
        );
    }
}

function userIsAdmin(user) {
    return Array.isArray(user?.roles) && user.roles.includes("ADMIN");
}

function userIsOrganizer(user) {
    return Array.isArray(user?.roles) &&
        (user.roles.includes("ORGANIZER") || user.roles.includes("ADMIN"));
}

export async function renderOrganizerDashboard(container, user) {
    pageLoading(container, "Loading organizer dashboard...");

    if (!userIsOrganizer(user)) {
        pageState(
            container,
            "Organizer Access Required",
            "This screen is available to organizer and administrator accounts.",
            "/races",
            "Back to Races"
        );
        return;
    }

    try {
        const races = await getAllBackendRaces();
        const managed = userIsAdmin(user)
            ? races
            : races.filter(
                race => String(race.organizerId) === String(user.userId)
            );

        const count = status =>
            managed.filter(
                race => String(race.status).toUpperCase() === status
            ).length;

        container.innerHTML = `
          <section class="medhmar-race-workflow">
            <div class="medhmar-workflow-heading">
              <div>
                <h1>Organizer Dashboard</h1>
                <p>Manage your races, registrations, and results.</p>
              </div>
              <button type="button" class="medhmar-view-race" data-create-race>
                + Create Race
              </button>
            </div>

            <div class="medhmar-organizer-stats">
              <div><span>Total Races</span><strong>${managed.length}</strong></div>
              <div><span>Scheduled</span><strong>${count("SCHEDULED")}</strong></div>
              <div><span>Open</span><strong>${count("OPEN")}</strong></div>
              <div><span>Completed</span><strong>${count("COMPLETED")}</strong></div>
            </div>

            <section class="medhmar-workflow-card">
              <div class="medhmar-participants-card-head">
                <div>
                  <h2>Managed Races</h2>
                  <p>Open a race to review entries or record results.</p>
                </div>
              </div>

              ${managed.length ? `
                <div class="medhmar-participants-table-wrap">
                  <table class="medhmar-participants-table">
                    <thead>
                      <tr>
                        <th>Race</th>
                        <th>Date</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${managed.map(race => `
                        <tr>
                          <td><strong>${escapeHtml(race.name)}</strong></td>
                          <td>${formatDate(race.startsAt)}</td>
                          <td>${escapeHtml(race.location)}</td>
                          <td>
                            <span class="medhmar-race-status ${statusClass(race.status)} medhmar-static-status">
                              ${escapeHtml(race.status)}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              class="medhmar-table-action"
                              data-manage-race="${escapeHtml(race.raceId)}"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
              ` : `
                <div class="medhmar-participants-empty">
                  <div class="medhmar-state-icon">🏁</div>
                  <h3>No Managed Races</h3>
                  <p>Create your first race to start managing entries.</p>
                </div>
              `}
            </section>
          </section>
        `;

        container.querySelector("[data-create-race]")?.addEventListener(
            "click",
            () => navigate("/organizer/races/new")
        );
        container.querySelectorAll("[data-manage-race]").forEach(button => {
            button.addEventListener(
                "click",
                () => navigate(
                    `/organizer/races/${encodeURIComponent(button.dataset.manageRace)}`
                )
            );
        });
    } catch (error) {
        pageState(
            container,
            "Unable to load organizer dashboard",
            error?.message || "Organizer races could not be loaded."
        );
    }
}

function raceFormMarkup(race, user, mode) {
    const isCreate = mode === "create";
    const admin = userIsAdmin(user);
    const organizerId = race?.organizerId ?? user?.userId ?? "";
    const currentStatus = String(race?.status || "SCHEDULED").toUpperCase();

    const transitions = {
        SCHEDULED: ["SCHEDULED", "OPEN", "CANCELLED"],
        OPEN: ["OPEN", "CLOSED", "CANCELLED"],
        CLOSED: ["CLOSED", "COMPLETED", "CANCELLED"],
        COMPLETED: ["COMPLETED"],
        CANCELLED: ["CANCELLED"]
    };

    const statuses = isCreate
        ? ["SCHEDULED", "OPEN"]
        : transitions[currentStatus] || [currentStatus];

    return `
      <form class="medhmar-race-form medhmar-race-form-grid" id="organizer-race-form">
        <label class="span-2">
          <span>Race Name</span>
          <input name="name" maxlength="150" required value="${escapeHtml(race?.name || "")}">
        </label>

        <label>
          <span>Start Date & Time</span>
          <input type="datetime-local" name="startsAt" required value="${escapeHtml(toDateTimeLocal(race?.startsAt))}">
        </label>

        <label>
          <span>Distance (KM)</span>
          <input type="number" name="distanceKm" min="0.1" step="0.1" required value="${escapeHtml(race?.distanceKm || "")}">
        </label>

        <label class="span-2">
          <span>Location</span>
          <input name="location" maxlength="255" required value="${escapeHtml(race?.location || "")}">
        </label>

        <label>
          <span>Status</span>
          <select name="status" required>
            ${statuses.map(status => `
              <option value="${status}" ${status === currentStatus ? "selected" : ""}>
                ${status}
              </option>
            `).join("")}
          </select>
        </label>

        <label>
          <span>Organizer ID</span>
          <input
            type="number"
            name="organizerId"
            min="1"
            required
            value="${escapeHtml(organizerId)}"
            ${admin ? "" : "readonly"}
          >
        </label>

        <label>
          <span>Organization ID</span>
          <input
            type="number"
            name="organizationId"
            min="1"
            value="${escapeHtml(race?.organizationId || "")}"
          >
        </label>

        <label>
          <span>Race Cover Image URL</span>
          <input
            type="url"
            name="coverImageUrl"
            maxlength="2048"
            placeholder="https://example.com/race-cover.jpg"
            value="${escapeHtml(race?.coverImageUrl || "")}"
          >
        </label>

        <label>
          <span>Results Image URL</span>
          <input
            type="url"
            name="resultsImageUrl"
            maxlength="2048"
            value="${escapeHtml(race?.resultsImageUrl || "")}"
          >
        </label>

        <div class="medhmar-form-feedback span-2" id="organizer-race-feedback" hidden></div>

        <div class="medhmar-form-actions span-2">
          <button type="submit" class="medhmar-view-race">
            ${isCreate ? "Create Race" : "Save Race"}
          </button>
          <button type="button" class="medhmar-outline-action" data-cancel-race-form>
            Cancel
          </button>
        </div>
      </form>
    `;
}

function racePayload(form) {
    const data = new FormData(form);
    const startsAt = new Date(data.get("startsAt"));

    return {
        name: String(data.get("name") || "").trim(),
        startsAt: startsAt.toISOString(),
        location: String(data.get("location") || "").trim(),
        distanceKm: Number(data.get("distanceKm")),
        status: String(data.get("status")),
        coverImageUrl: String(data.get("coverImageUrl") || "").trim() || null,
        resultsImageUrl: String(data.get("resultsImageUrl") || "").trim() || null,
        organizerId: Number(data.get("organizerId")),
        organizationId: data.get("organizationId")
            ? Number(data.get("organizationId"))
            : null
    };
}

export async function renderCreateRace(container, user) {
    if (!userIsOrganizer(user)) {
        pageState(
            container,
            "Organizer Access Required",
            "Only organizers and administrators can create races."
        );
        return;
    }

    container.innerHTML = `
      <section class="medhmar-race-workflow medhmar-form-page">
        <button type="button" class="medhmar-back-races" data-back-organizer>
          ← Back to Organizer Dashboard
        </button>

        <div class="medhmar-workflow-heading">
          <div>
            <h1>Create New Race</h1>
            <p>Add a race using fields supported by the MEDHMAR backend.</p>
          </div>
        </div>

        <section class="medhmar-workflow-card medhmar-form-card">
          ${raceFormMarkup(null, user, "create")}
        </section>
      </section>
    `;

    const back = () => navigate("/organizer");
    container.querySelector("[data-back-organizer]")?.addEventListener("click", back);
    container.querySelector("[data-cancel-race-form]")?.addEventListener("click", back);

    container.querySelector("#organizer-race-form")?.addEventListener(
        "submit",
        async event => {
            event.preventDefault();
            const form = event.currentTarget;
            const button = form.querySelector('[type="submit"]');
            const feedback = container.querySelector("#organizer-race-feedback");
            button.disabled = true;
            feedback.hidden = false;

            try {
                const created = await raceApi.createRace(racePayload(form));
                feedback.className = "medhmar-form-feedback success";
                feedback.textContent = "Race created successfully.";
                setTimeout(
                    () => navigate(`/organizer/races/${encodeURIComponent(created.raceId)}`),
                    450
                );
            } catch (error) {
                feedback.className = "medhmar-form-feedback error";
                feedback.textContent =
                    error?.message || "Unable to create the race.";
                button.disabled = false;
            }
        }
    );
}

async function organizerEntries(raceId) {
    const entries = await raceEntryApi.getForRace(raceId);

    const enriched = await Promise.all(
        (entries || []).map(async entry => {
            const camel = await safeCamel(entry.camelId);
            let result = null;

            if (String(entry.entryStatus).toUpperCase() === "ACCEPTED") {
                try {
                    result = await raceResultApi.getByEntryId(entry.entryId);
                } catch (error) {
                    if (error?.status !== 404) throw error;
                }
            }

            return {
                ...entry,
                camelName: camel?.name || `Camel #${entry.camelId}`,
                result
            };
        })
    );

    return enriched;
}

export async function renderManageRace(container, raceId, user) {
    pageLoading(container, "Loading race management...");

    if (!userIsOrganizer(user)) {
        pageState(
            container,
            "Organizer Access Required",
            "Only organizers and administrators can manage races."
        );
        return;
    }

    try {
        const [race, entries] = await Promise.all([
            raceApi.getRaceById(raceId),
            organizerEntries(raceId)
        ]);

        const pending = entries.filter(
            entry => String(entry.entryStatus).toUpperCase() === "PENDING"
        );

        container.innerHTML = `
          <section class="medhmar-race-workflow medhmar-manage-page">
            <button type="button" class="medhmar-back-races" data-back-organizer>
              ← Back to Organizer Dashboard
            </button>

            <div class="medhmar-workflow-heading">
              <div>
                <div class="medhmar-detail-title">
                  <h1>Manage Race</h1>
                  <span class="medhmar-race-status ${statusClass(race.status)} medhmar-static-status">
                    ${escapeHtml(race.status)}
                  </span>
                </div>
                <p>${escapeHtml(race.name)} · Race #${escapeHtml(race.raceId)}</p>
              </div>
              <button type="button" class="medhmar-table-action danger" data-delete-race>
                Delete Race
              </button>
            </div>

            <section class="medhmar-workflow-card medhmar-form-card">
              <div class="medhmar-participants-card-head">
                <div>
                  <h2>Race Details</h2>
                  <p>Edit race information and valid status transitions.</p>
                </div>
              </div>
              ${raceFormMarkup(race, user, "edit")}
            </section>

            <section class="medhmar-workflow-card">
              <div class="medhmar-participants-card-head">
                <div>
                  <h2>Registration Decisions</h2>
                  <p>${pending.length} pending entr${pending.length === 1 ? "y" : "ies"}.</p>
                </div>
              </div>

              ${entries.length ? `
                <div class="medhmar-participants-table-wrap">
                  <table class="medhmar-participants-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Camel</th>
                        <th>Registrant</th>
                        <th>Status</th>
                        <th>Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${entries.map(entry => `
                        <tr>
                          <td>#${escapeHtml(entry.participantNumber)}</td>
                          <td><strong>${escapeHtml(entry.camelName)}</strong></td>
                          <td>#${escapeHtml(entry.registrantId)}</td>
                          <td>
                            <span class="medhmar-entry-status ${entryStatusClass(entry.entryStatus)}">
                              ${escapeHtml(entry.entryStatus)}
                            </span>
                          </td>
                          <td>
                            ${String(entry.entryStatus).toUpperCase() === "PENDING" ? `
                              <div class="medhmar-row-actions">
                                <button
                                  type="button"
                                  class="medhmar-table-action"
                                  data-entry-decision="ACCEPTED"
                                  data-entry-id="${escapeHtml(entry.entryId)}"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  class="medhmar-table-action danger"
                                  data-entry-decision="REJECTED"
                                  data-entry-id="${escapeHtml(entry.entryId)}"
                                >
                                  Reject
                                </button>
                              </div>
                            ` : "—"}
                          </td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
              ` : `
                <div class="medhmar-participants-empty">
                  <div class="medhmar-state-icon">🐪</div>
                  <h3>No Registrations</h3>
                  <p>No camels have registered for this race yet.</p>
                </div>
              `}
            </section>

            <section class="medhmar-workflow-card">
              <div class="medhmar-participants-card-head">
                <div>
                  <h2>Record Results</h2>
                  <p>Results can be saved for accepted entries after the race starts and when the race is CLOSED or COMPLETED.</p>
                </div>
              </div>

              ${entries.some(entry => String(entry.entryStatus).toUpperCase() === "ACCEPTED") ? `
                <div class="medhmar-result-editor">
                  ${entries
                    .filter(entry => String(entry.entryStatus).toUpperCase() === "ACCEPTED")
                    .map(entry => `
                      <form class="medhmar-result-row" data-result-form="${escapeHtml(entry.entryId)}">
                        <div>
                          <strong>#${escapeHtml(entry.participantNumber)} · ${escapeHtml(entry.camelName)}</strong>
                          <span>Entry #${escapeHtml(entry.entryId)}</span>
                        </div>
                        <label>
                          <span>Position</span>
                          <input
                            type="number"
                            min="1"
                            name="finishPosition"
                            required
                            value="${escapeHtml(entry.result?.finishPosition || "")}"
                          >
                        </label>
                        <label>
                          <span>Elapsed (ms)</span>
                          <input
                            type="number"
                            min="1"
                            name="elapsedMs"
                            required
                            value="${escapeHtml(entry.result?.elapsedMs || "")}"
                          >
                        </label>
                        <button type="submit" class="medhmar-table-action">
                          ${entry.result ? "Update Result" : "Save Result"}
                        </button>
                        <input type="hidden" name="hasResult" value="${entry.result ? "true" : "false"}">
                      </form>
                    `).join("")}
                </div>
              ` : `
                <div class="medhmar-participants-empty">
                  <div class="medhmar-state-icon">🏁</div>
                  <h3>No Accepted Entries</h3>
                  <p>Accept race entries before recording results.</p>
                </div>
              `}

              <div class="medhmar-form-feedback" id="manage-race-feedback" hidden></div>
            </section>
          </section>
        `;

        const rerender = () => renderManageRace(container, raceId, user);
        container.querySelector("[data-back-organizer]")?.addEventListener(
            "click",
            () => navigate("/organizer")
        );

        container.querySelector("[data-cancel-race-form]")?.addEventListener(
            "click",
            () => navigate("/organizer")
        );

        container.querySelector("#organizer-race-form")?.addEventListener(
            "submit",
            async event => {
                event.preventDefault();
                const button = event.currentTarget.querySelector('[type="submit"]');
                const feedback = container.querySelector("#organizer-race-feedback");
                button.disabled = true;
                feedback.hidden = false;

                try {
                    await raceApi.updateRace(
                        raceId,
                        racePayload(event.currentTarget)
                    );
                    feedback.className = "medhmar-form-feedback success";
                    feedback.textContent = "Race updated successfully.";
                    setTimeout(rerender, 350);
                } catch (error) {
                    feedback.className = "medhmar-form-feedback error";
                    feedback.textContent =
                        error?.message || "Unable to update the race.";
                    button.disabled = false;
                }
            }
        );

        container.querySelectorAll("[data-entry-decision]").forEach(button => {
            button.addEventListener("click", async () => {
                button.disabled = true;
                try {
                    await raceEntryApi.updateStatus(
                        button.dataset.entryId,
                        { entryStatus: button.dataset.entryDecision }
                    );
                    await rerender();
                } catch (error) {
                    const feedback = container.querySelector("#manage-race-feedback");
                    feedback.hidden = false;
                    feedback.className = "medhmar-form-feedback error";
                    feedback.textContent =
                        error?.message || "Unable to update this registration.";
                    button.disabled = false;
                }
            });
        });

        container.querySelectorAll("[data-result-form]").forEach(form => {
            form.addEventListener("submit", async event => {
                event.preventDefault();
                const button = form.querySelector('[type="submit"]');
                const data = new FormData(form);
                const entryId = form.dataset.resultForm;
                const payload = {
                    entryId: Number(entryId),
                    finishPosition: Number(data.get("finishPosition")),
                    elapsedMs: Number(data.get("elapsedMs"))
                };
                const feedback = container.querySelector("#manage-race-feedback");
                button.disabled = true;

                try {
                    if (data.get("hasResult") === "true") {
                        await raceResultApi.update(entryId, payload);
                    } else {
                        await raceResultApi.create(payload);
                    }
                    feedback.hidden = false;
                    feedback.className = "medhmar-form-feedback success";
                    feedback.textContent = "Race result saved successfully.";
                    setTimeout(rerender, 350);
                } catch (error) {
                    feedback.hidden = false;
                    feedback.className = "medhmar-form-feedback error";
                    feedback.textContent =
                        error?.message || "Unable to save the race result.";
                    button.disabled = false;
                }
            });
        });

        container.querySelector("[data-delete-race]")?.addEventListener(
            "click",
            async () => {
                if (!window.confirm("Delete this race? This action cannot be undone.")) {
                    return;
                }

                try {
                    await raceApi.deleteRace(raceId);
                    navigate("/organizer");
                } catch (error) {
                    const feedback = container.querySelector("#manage-race-feedback");
                    feedback.hidden = false;
                    feedback.className = "medhmar-form-feedback error";
                    feedback.textContent =
                        error?.message || "Unable to delete the race.";
                }
            }
        );
    } catch (error) {
        pageState(
            container,
            "Unable to manage race",
            error?.message || "Race management data could not be loaded.",
            "/organizer",
            "Back to Organizer"
        );
    }
}
