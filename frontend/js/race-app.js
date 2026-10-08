import {
    raceApi,
    raceEntryApi
} from "./race-api.js";
import { authApi } from "./api.js";

const HERO_IMAGE = "/assets/racing-hero.webp";

// Use locally hosted, distinct racing photographs instead of repeating one
// image across the entire race directory. These are illustrative preview photos.
const RACE_IMAGES = [
    HERO_IMAGE,
    "/assets/mock-camels/camel-1.jpg",
    "/assets/mock-camels/camel-8.jpg",
    "/assets/landing-hero-wide.png",
    "/assets/mock-camels/camel-7.jpg"
];

function fallbackRaceImage(race) {
    // Stable by ID/name: filtering or tab changes never swap a race's photo.
    const key = String(race.raceId ?? race.name ?? "race");
    let hash = 0;
    for (const character of key) {
        hash = (hash * 31 + character.charCodeAt(0)) % RACE_IMAGES.length;
    }
    return RACE_IMAGES[hash];
}

const DEMO_RACES = [
    {
        raceId: "demo-nizwa",
        name: "Nizwa Heritage Race",
        startsAt: "2026-10-18T03:30:00Z",
        location: "Nizwa, Oman",
        distanceKm: 6,
        status: "SCHEDULED",
        organizerName: "Nizwa Racing Club",
        category: "Heritage Race",
        trackType: "Sand Track",
        coverImage: HERO_IMAGE
    },
    {
        raceId: "demo-salalah",
        name: "Salalah Summer Race",
        startsAt: "2026-10-25T02:00:00Z",
        location: "Salalah, Oman",
        distanceKm: 8,
        status: "SCHEDULED",
        organizerName: "Dhofar Racing",
        category: "Open Race",
        trackType: "Sand Track",
        coverImage: RACE_IMAGES[1]
    },
    {
        raceId: "demo-alwusta",
        name: "Al Wusta Desert Challenge",
        startsAt: "2026-11-02T03:00:00Z",
        location: "Haima, Oman",
        distanceKm: 7,
        status: "SCHEDULED",
        organizerName: "Al Wusta Racing Club",
        category: "Desert Race",
        trackType: "Sand Track",
        coverImage: RACE_IMAGES[2]
    },
    {
        raceId: "demo-muscat",
        name: "Muscat Desert Sprint",
        startsAt: "2026-10-10T03:00:00Z",
        location: "Muscat, Oman",
        distanceKm: 5,
        status: "OPEN",
        organizerName: "Muscat Camel Racing",
        category: "Sprint Race",
        trackType: "Sand Track",
        coverImage: RACE_IMAGES[3]
    },
    {
        raceId: "demo-sohar",
        name: "Sohar Heritage Cup",
        startsAt: "2026-09-28T03:00:00Z",
        location: "Sohar, Oman",
        distanceKm: 7,
        status: "COMPLETED",
        organizerName: "Al Batinah Racing",
        category: "Heritage Cup",
        trackType: "Sand Track",
        coverImage: RACE_IMAGES[4]
    }
];


const DEMO_PARTICIPANTS = {
    "demo-nizwa": [
        {
            entryId: "demo-entry-1",
            participantNumber: 1,
            entryStatus: "ACCEPTED",
            raceId: "demo-nizwa",
            registrantId: "demo-owner-1",
            camelId: "demo-camel-1",
            camelName: "Al Barq",
            registrantName: "Ahmed Al Hinai",
            registeredAt: "2026-10-05T08:30:00Z"
        },
        {
            entryId: "demo-entry-2",
            participantNumber: 2,
            entryStatus: "ACCEPTED",
            raceId: "demo-nizwa",
            registrantId: "demo-owner-2",
            camelId: "demo-camel-2",
            camelName: "Shaheen",
            registrantName: "Khalid Al Balushi",
            registeredAt: "2026-10-05T09:15:00Z"
        },
        {
            entryId: "demo-entry-3",
            participantNumber: 3,
            entryStatus: "PENDING",
            raceId: "demo-nizwa",
            registrantId: "demo-owner-3",
            camelId: "demo-camel-3",
            camelName: "Al Sahab",
            registrantName: "Salim Al Busaidi",
            registeredAt: "2026-10-06T07:45:00Z"
        }
    ],

    "demo-salalah": [
        {
            entryId: "demo-entry-4",
            participantNumber: 1,
            entryStatus: "ACCEPTED",
            raceId: "demo-salalah",
            registrantId: "demo-owner-4",
            camelId: "demo-camel-4",
            camelName: "Najm",
            registrantName: "Mohammed Al Rashdi",
            registeredAt: "2026-10-06T10:00:00Z"
        },
        {
            entryId: "demo-entry-5",
            participantNumber: 2,
            entryStatus: "PENDING",
            raceId: "demo-salalah",
            registrantId: "demo-owner-5",
            camelId: "demo-camel-5",
            camelName: "Al Wathba",
            registrantName: "Saeed Al Amri",
            registeredAt: "2026-10-06T11:20:00Z"
        }
    ],

    "demo-alwusta": [
        {
            entryId: "demo-entry-6",
            participantNumber: 1,
            entryStatus: "ACCEPTED",
            raceId: "demo-alwusta",
            registrantId: "demo-owner-6",
            camelId: "demo-camel-6",
            camelName: "Rimal",
            registrantName: "Ali Al Kindi",
            registeredAt: "2026-10-07T06:30:00Z"
        }
    ],

    "demo-sohar": [
        {
            entryId: "demo-result-1",
            participantNumber: 11,
            entryStatus: "ACCEPTED",
            raceId: "demo-sohar",
            registrantId: "demo-owner-7",
            camelId: "demo-camel-7",
            camelName: "Al Shamal",
            registrantName: "Hamad Al Hinai",
            registeredAt: "2026-09-20T07:20:00Z"
        },
        {
            entryId: "demo-result-2",
            participantNumber: 7,
            entryStatus: "ACCEPTED",
            raceId: "demo-sohar",
            registrantId: "demo-owner-8",
            camelId: "demo-camel-8",
            camelName: "Barq",
            registrantName: "Yousef Al Balushi",
            registeredAt: "2026-09-20T08:05:00Z"
        },
        {
            entryId: "demo-result-3",
            participantNumber: 3,
            entryStatus: "ACCEPTED",
            raceId: "demo-sohar",
            registrantId: "demo-owner-9",
            camelId: "demo-camel-9",
            camelName: "Sahab",
            registrantName: "Saeed Al Busaidi",
            registeredAt: "2026-09-20T08:40:00Z"
        }
    ]
};



const state = {
    search: "",
    date: "",
    location: "",
    status: "",
    tab: "upcoming",
    page: 0,
    size: 6
};

let backendCache = [];
let backendLoaded = false;

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDate(value) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(new Date(value));
}

function formatTime(value) {
    return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(value));
}

function dateKey(value) {
    const date = new Date(value);

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

function isDemoRace(raceId) {
    return String(raceId).startsWith("demo-");
}

function findDemoRace(raceId) {
    return DEMO_RACES.find(
        race => String(race.raceId) === String(raceId)
    );
}

function navigateRacePath(path) {
    history.pushState({}, "", path);
    window.dispatchEvent(
        new PopStateEvent("popstate")
    );
}

function statusLabel(status) {
    const value = String(status || "").toUpperCase();

    if (value === "SCHEDULED") {
        return "UPCOMING";
    }

    return value;
}

function statusClass(status) {
    const value = String(status || "").toUpperCase();

    if (value === "OPEN") {
        return "open";
    }

    if (value === "SCHEDULED") {
        return "upcoming";
    }

    if (value === "COMPLETED") {
        return "completed";
    }

    if (value === "CLOSED") {
        return "closed";
    }

    if (value === "CANCELLED") {
        return "cancelled";
    }

    return "neutral";
}

function backendOrganizerLabel(race) {
    if (race.organizerId) {
        return `Organizer #${race.organizerId}`;
    }

    return "Organizer";
}

function normalizeBackendRace(race) {
    return {
        raceId: race.raceId,
        name: race.name,
        startsAt: race.startsAt,
        location: race.location,
        distanceKm: race.distanceKm,
        status: race.status,
        resultsImageUrl: race.resultsImageUrl,
        organizerId: race.organizerId,
        organizationId: race.organizationId,
        organizerName: backendOrganizerLabel(race),
        coverImage: race.coverImage || fallbackRaceImage(race)
    };
}

async function fetchBackendRaces() {
    if (backendLoaded) {
        return backendCache;
    }

    try {
        const response = await raceApi.getRaces(
            "",
            "",
            0,
            100
        );

        const races = Array.isArray(response)
            ? response
            : response?.content || [];

        backendCache = races.map(normalizeBackendRace);
        backendLoaded = true;

        return backendCache;
    } catch {
        backendCache = [];
        return [];
    }
}

async function getRaceById(raceId) {
    const demoRace = findDemoRace(raceId);

    if (demoRace) {
        return demoRace;
    }

    let race;

    if (typeof raceApi.getRaceById === "function") {
        race = await raceApi.getRaceById(raceId);
    } else if (typeof raceApi.one === "function") {
        race = await raceApi.one(raceId);
    } else {
        throw new Error(
            "Race details API method is not available."
        );
    }

    return normalizeBackendRace(race);
}

async function getAllRaces() {
    const backendRaces = await fetchBackendRaces();

    return [
        ...backendRaces,
        ...DEMO_RACES
    ];
}

function matchesTab(race, tab) {
    const status = String(race.status).toUpperCase();

    if (tab === "upcoming") {
        return status === "SCHEDULED";
    }

    if (tab === "live") {
        return status === "OPEN";
    }

    if (tab === "completed") {
        return status === "COMPLETED";
    }

    return true;
}

function filterRaces(races) {
    const search = state.search.toLowerCase();

    return races.filter(race => {
        const searchText = [
            race.name,
            race.location,
            race.organizerName
        ]
            .join(" ")
            .toLowerCase();

        if (
            search &&
            !searchText.includes(search)
        ) {
            return false;
        }

        if (
            state.date &&
            dateKey(race.startsAt) !== state.date
        ) {
            return false;
        }

        if (
            state.location &&
            race.location !== state.location
        ) {
            return false;
        }

        if (
            state.status &&
            String(race.status).toUpperCase() !== state.status
        ) {
            return false;
        }

        if (state.status) {
            return true;
        }

        return matchesTab(race, state.tab);
    });
}

function tabCount(races, tab) {
    return races.filter(
        race => matchesTab(race, tab)
    ).length;
}

function raceRow(race, index) {
    return `
    <article class="medhmar-race-row">

      <div class="medhmar-race-image image-${index % 4}">
        <img
          src="${escapeHtml(race.coverImage || HERO_IMAGE)}"
          alt="${escapeHtml(race.name)}"
        >
      </div>

      <div class="medhmar-race-content">

        <div class="medhmar-race-name-line">

          <h3>
            ${escapeHtml(race.name)}
          </h3>

          <span
            class="
              medhmar-race-status
              ${statusClass(race.status)}
            "
          >
            ${escapeHtml(statusLabel(race.status))}
          </span>

        </div>

        <div class="medhmar-race-primary-meta">

          <span>
            <span class="meta-icon">▣</span>
            ${formatDate(race.startsAt)}
          </span>

          <span>
            <span class="meta-icon">◷</span>
            ${formatTime(race.startsAt)}
          </span>

        </div>

        <div class="medhmar-race-secondary-meta">

          <span>
            <span class="meta-icon">⌖</span>
            ${escapeHtml(race.location)}
          </span>

          <span>
            <span class="meta-icon">↔</span>
            ${escapeHtml(race.distanceKm)} KM
          </span>

          <span>
            <span class="meta-icon">◇</span>
            Organized by
            ${escapeHtml(race.organizerName)}
          </span>

        </div>

      </div>

      <div class="medhmar-race-action">

        <button
          type="button"
          class="medhmar-view-race"
          data-view-race="${escapeHtml(race.raceId)}"
        >
          View Race
          <span>→</span>
        </button>

      </div>

    </article>
  `;
}

function loading(container) {
    container.innerHTML = `
    <section class="medhmar-races-page">

      <div class="medhmar-race-state">

        <div class="medhmar-race-loader"></div>

        <h2>
          Loading races...
        </h2>

      </div>

    </section>
  `;
}

function errorState(container, message) {
    container.innerHTML = `
    <section class="medhmar-races-page">

      <div class="medhmar-race-state">

        <div class="medhmar-state-icon">
          !
        </div>

        <h2>
          Unable to load race
        </h2>

        <p>
          ${escapeHtml(message)}
        </p>

        <button
          type="button"
          class="medhmar-view-race"
          data-back-races
        >
          Back to Races
        </button>

      </div>

    </section>
  `;

    container
        .querySelector("[data-back-races]")
        ?.addEventListener(
            "click",
            () => {
                navigateRacePath("/races");
            }
        );
}

export function resetRaceListing() {
    state.search = "";
    state.date = "";
    state.location = "";
    state.status = "";
    state.tab = "upcoming";
    state.page = 0;
}

export async function renderRacesListing(container) {
    loading(container);

    const races = await getAllRaces();
    const currentUser = await authApi.me().catch(() => null);
    const roles = Array.isArray(currentUser?.roles)
        ? currentUser.roles.map(role => String(role).toUpperCase())
        : [];
    const canOpenOrganizer =
        roles.includes("ORGANIZER") || roles.includes("ADMIN");

    const locations = [
        ...new Set(
            races
                .map(race => race.location)
                .filter(Boolean)
        )
    ].sort();

    const dates = [
        ...new Set(
            races
                .map(race => dateKey(race.startsAt))
                .filter(Boolean)
        )
    ].sort();

    const filtered = filterRaces(races);

    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / state.size)
    );

    if (state.page >= totalPages) {
        state.page = 0;
    }

    const pageStart = state.page * state.size;

    const pageItems = filtered.slice(
        pageStart,
        pageStart + state.size
    );

    container.innerHTML = `
    <section class="medhmar-races-page">

      <div class="medhmar-races-heading">
        <h1>
          Races
        </h1>

        ${canOpenOrganizer ? `
          <button
            type="button"
            class="medhmar-view-race"
            data-organizer-dashboard
          >
            Organizer Dashboard
          </button>
        ` : ""}
      </div>

      <div class="medhmar-race-filters">

        <label class="medhmar-race-search">

          <span>⌕</span>

          <input
            type="search"
            id="race-search"
            placeholder="Search races..."
            value="${escapeHtml(state.search)}"
          >

        </label>

        <select id="race-date">

          <option value="">
            Date
          </option>

          ${dates
        .map(
            value => `
                <option
                  value="${value}"
                  ${
                state.date === value
                    ? "selected"
                    : ""
            }
                >
                  ${formatDate(
                `${value}T00:00:00`
            )}
                </option>
              `
        )
        .join("")}

        </select>

        <select id="race-location">

          <option value="">
            Location
          </option>

          ${locations
        .map(
            location => `
                <option
                  value="${escapeHtml(location)}"
                  ${
                state.location === location
                    ? "selected"
                    : ""
            }
                >
                  ${escapeHtml(location)}
                </option>
              `
        )
        .join("")}

        </select>

        <select id="race-status">

          <option value="">
            Status
          </option>

          ${[
        "SCHEDULED",
        "OPEN",
        "CLOSED",
        "COMPLETED",
        "CANCELLED"
    ]
        .map(
            status => `
                <option
                  value="${status}"
                  ${
                state.status === status
                    ? "selected"
                    : ""
            }
                >
                  ${statusLabel(status)}
                </option>
              `
        )
        .join("")}

        </select>

      </div>

      <div class="medhmar-race-tabs">

        <button
          type="button"
          data-tab="upcoming"
          class="${
        state.tab === "upcoming"
            ? "active"
            : ""
    }"
        >
          Upcoming
          <span>
            ${tabCount(races, "upcoming")}
          </span>
        </button>

        <button
          type="button"
          data-tab="live"
          class="${
        state.tab === "live"
            ? "active"
            : ""
    }"
        >
          Live
          <span>
            ${tabCount(races, "live")}
          </span>
        </button>

        <button
          type="button"
          data-tab="completed"
          class="${
        state.tab === "completed"
            ? "active"
            : ""
    }"
        >
          Completed
          <span>
            ${tabCount(races, "completed")}
          </span>
        </button>

      </div>

      <div class="medhmar-race-list">

        ${
        pageItems.length
            ? pageItems
                .map(
                    (race, index) =>
                        raceRow(race, index)
                )
                .join("")
            : `
              <div class="medhmar-race-state">

                <div class="medhmar-state-icon">
                  🏁
                </div>

                <h2>
                  No Races Found
                </h2>

                <p>
                  Try changing your search
                  or filters.
                </p>

              </div>
            `
    }

      </div>

      ${
        totalPages > 1
            ? `
            <div class="medhmar-race-pagination">

              <button
                type="button"
                data-page-prev
                ${
                state.page === 0
                    ? "disabled"
                    : ""
            }
              >
                Previous
              </button>

              <span>
                ${state.page + 1}
                /
                ${totalPages}
              </span>

              <button
                type="button"
                data-page-next
                ${
                state.page + 1 >= totalPages
                    ? "disabled"
                    : ""
            }
              >
                Next
              </button>

            </div>
          `
            : ""
    }

    </section>
  `;

    container
        .querySelector("[data-organizer-dashboard]")
        ?.addEventListener(
            "click",
            () => {
                navigateRacePath("/organizer");
            }
        );

    let searchTimer;

    container
        .querySelector("#race-search")
        ?.addEventListener(
            "input",
            event => {
                clearTimeout(searchTimer);

                searchTimer = setTimeout(
                    () => {
                        state.search =
                            event.target.value.trim();

                        state.page = 0;

                        renderRacesListing(container);
                    },
                    250
                );
            }
        );

    container
        .querySelector("#race-date")
        ?.addEventListener(
            "change",
            event => {
                state.date = event.target.value;
                state.page = 0;

                renderRacesListing(container);
            }
        );

    container
        .querySelector("#race-location")
        ?.addEventListener(
            "change",
            event => {
                state.location = event.target.value;
                state.page = 0;

                renderRacesListing(container);
            }
        );

    container
        .querySelector("#race-status")
        ?.addEventListener(
            "change",
            event => {
                state.status = event.target.value;
                state.page = 0;

                renderRacesListing(container);
            }
        );

    container
        .querySelectorAll("[data-tab]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    state.tab = button.dataset.tab;
                    state.status = "";
                    state.page = 0;

                    renderRacesListing(container);
                }
            );
        });

    container
        .querySelectorAll("[data-view-race]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    navigateRacePath(
                        `/races/${encodeURIComponent(
                            button.dataset.viewRace
                        )}`
                    );
                }
            );
        });

    container
        .querySelector("[data-page-prev]")
        ?.addEventListener(
            "click",
            () => {
                state.page = Math.max(
                    0,
                    state.page - 1
                );

                renderRacesListing(container);
            }
        );

    container
        .querySelector("[data-page-next]")
        ?.addEventListener(
            "click",
            () => {
                state.page += 1;

                renderRacesListing(container);
            }
        );
}

export async function renderRaceDetails(
    container,
    raceId
) {
    loading(container);

    try {
        const race = await getRaceById(raceId);
        const demo = isDemoRace(race.raceId);

        const information = demo
            ? `
        <div>
          <span>
            Category
          </span>

          <strong>
            ${escapeHtml(race.category)}
          </strong>
        </div>

        <div>
          <span>
            Track Type
          </span>

          <strong>
            ${escapeHtml(race.trackType)}
          </strong>
        </div>

        <div>
          <span>
            Organizer
          </span>

          <strong>
            ${escapeHtml(race.organizerName)}
          </strong>
        </div>

        <div>
          <span>
            Location
          </span>

          <strong>
            ${escapeHtml(race.location)}
          </strong>
        </div>
      `
            : `
        <div>
          <span>
            Race ID
          </span>

          <strong>
            #${escapeHtml(race.raceId)}
          </strong>
        </div>

        <div>
          <span>
            Organizer ID
          </span>

          <strong>
            #${escapeHtml(race.organizerId)}
          </strong>
        </div>

        <div>
          <span>
            Organization
          </span>

          <strong>
            ${
                race.organizationId
                    ? `#${escapeHtml(race.organizationId)}`
                    : "Independent"
            }
          </strong>
        </div>

        <div>
          <span>
            Location
          </span>

          <strong>
            ${escapeHtml(race.location)}
          </strong>
        </div>
      `;

        container.innerHTML = `
      <section class="medhmar-race-details">

        <button
          type="button"
          class="medhmar-back-races"
          data-back-races
        >
          ← Back to Races
        </button>

        <div class="medhmar-detail-heading">

          <div>

            <div class="medhmar-detail-title">

              <h1>
                ${escapeHtml(race.name)}
              </h1>

              <span
                class="
                  medhmar-race-status
                  ${statusClass(race.status)}
                "
              >
                ${escapeHtml(
            statusLabel(race.status)
        )}
              </span>

            </div>

            <p>
              ${
            demo
                ? "Sample Race"
                : `Race #${escapeHtml(
                    race.raceId
                )}`
        }
            </p>

          </div>

          ${
            race.status === "OPEN"
                ? `
                <button
                  type="button"
                  class="medhmar-view-race"
                  data-register-race
                >
                  Register Camel
                </button>
              `
                : ""
        }

        </div>

        <div class="medhmar-detail-hero">

          <img
            src="${escapeHtml(
            race.coverImage || HERO_IMAGE
        )}"
            alt="${escapeHtml(race.name)}"
          >

          <div class="medhmar-detail-hero-meta">

            <div>
              <span>
                Date
              </span>

              <strong>
                ${formatDate(race.startsAt)}
              </strong>
            </div>

            <div>
              <span>
                Time
              </span>

              <strong>
                ${formatTime(race.startsAt)}
              </strong>
            </div>

            <div>
              <span>
                Location
              </span>

              <strong>
                ${escapeHtml(race.location)}
              </strong>
            </div>

            <div>
              <span>
                Distance
              </span>

              <strong>
                ${escapeHtml(race.distanceKm)}
                KM
              </strong>
            </div>

          </div>

        </div>

        <div class="medhmar-detail-tabs">

          <button
            type="button"
            class="active"
          >
            Overview
          </button>

          <button
            type="button"
            data-participants
          >
            Participants
          </button>

          <button
            type="button"
            data-results
          >
            Results
          </button>

        </div>

        <div class="medhmar-detail-layout">

          <div class="medhmar-detail-main">

            <article class="medhmar-detail-card">

              <h2>
                About the Race
              </h2>

              <p>
                ${escapeHtml(race.name)}
                is a MEDHMAR camel race
                taking place at
                ${escapeHtml(race.location)}
                over a distance of
                ${escapeHtml(race.distanceKm)}
                KM.
              </p>

            </article>

            <div class="medhmar-detail-grid">

              <article class="medhmar-detail-card">

                <span>
                  Start Date
                </span>

                <strong>
                  ${formatDate(race.startsAt)}
                </strong>

              </article>

              <article class="medhmar-detail-card">

                <span>
                  Start Time
                </span>

                <strong>
                  ${formatTime(race.startsAt)}
                </strong>

              </article>

              <article class="medhmar-detail-card">

                <span>
                  Distance
                </span>

                <strong>
                  ${escapeHtml(race.distanceKm)}
                  KM
                </strong>

              </article>

              <article class="medhmar-detail-card">

                <span>
                  Status
                </span>

                <strong>
                  ${escapeHtml(
            statusLabel(race.status)
        )}
                </strong>

              </article>

            </div>

          </div>

          <aside
            class="
              medhmar-detail-card
              medhmar-detail-side
            "
          >

            <h3>
              Race Information
            </h3>

            ${information}

          </aside>

        </div>

      </section>
    `;

        container
            .querySelector("[data-back-races]")
            ?.addEventListener(
                "click",
                () => {
                    navigateRacePath("/races");
                }
            );

        container
            .querySelector("[data-participants]")
            ?.addEventListener(
                "click",
                () => {
                    navigateRacePath(
                        `/races/${encodeURIComponent(
                            raceId
                        )}/participants`
                    );
                }
            );

        container
            .querySelector("[data-results]")
            ?.addEventListener(
                "click",
                () => {
                    navigateRacePath(
                        `/races/${encodeURIComponent(
                            raceId
                        )}/results`
                    );
                }
            );

        container
            .querySelector("[data-register-race]")
            ?.addEventListener(
                "click",
                () => {
                    navigateRacePath(
                        `/races/${encodeURIComponent(
                            raceId
                        )}/register`
                    );
                }
            );

    } catch (error) {
        errorState(
            container,
            error?.message ||
            "Unable to load race details."
        );
    }
}


function participantStatusClass(status) {
    const value = String(status || "").toUpperCase();

    if (value === "ACCEPTED") {
        return "accepted";
    }

    if (value === "PENDING") {
        return "pending";
    }

    if (value === "REJECTED") {
        return "rejected";
    }

    if (value === "WITHDRAWN") {
        return "withdrawn";
    }

    return "neutral";
}

function participantStatusLabel(status) {
    return String(status || "UNKNOWN").toUpperCase();
}

async function getParticipantsForRace(raceId) {
    if (isDemoRace(raceId)) {
        return DEMO_PARTICIPANTS[raceId] || [];
    }

    return raceEntryApi.getForRace(raceId);
}

export async function renderRaceParticipants(
    container,
    raceId
) {
    loading(container);

    try {
        const race = await getRaceById(raceId);
        const participants =
            await getParticipantsForRace(raceId);

        const demo = isDemoRace(raceId);

        container.innerHTML = `
          <section class="medhmar-participants-page">

            <button
              type="button"
              class="medhmar-back-races"
              data-back-race
            >
              ← Back to Race
            </button>

            <div class="medhmar-participants-heading">

              <div>

                <div class="medhmar-detail-title">

                  <h1>
                    Participants
                  </h1>

                  <span
                    class="
                      medhmar-race-status
                      ${statusClass(race.status)}
                    "
                  >
                    ${escapeHtml(
            statusLabel(race.status)
        )}
                  </span>

                </div>

                <p>
                  ${escapeHtml(race.name)}
                </p>

              </div>

              <div class="medhmar-participant-count">
                ${participants.length}
                ${
            participants.length === 1
                ? "Participant"
                : "Participants"
        }
              </div>

            </div>

            <div class="medhmar-participants-race-info">

              <div>
                <span>Date</span>
                <strong>
                  ${formatDate(race.startsAt)}
                </strong>
              </div>

              <div>
                <span>Time</span>
                <strong>
                  ${formatTime(race.startsAt)}
                </strong>
              </div>

              <div>
                <span>Location</span>
                <strong>
                  ${escapeHtml(race.location)}
                </strong>
              </div>

              <div>
                <span>Distance</span>
                <strong>
                  ${escapeHtml(race.distanceKm)}
                  KM
                </strong>
              </div>

            </div>

            <div class="medhmar-detail-tabs">

              <button
                type="button"
                data-overview
              >
                Overview
              </button>

              <button
                type="button"
                class="active"
              >
                Participants
              </button>

              <button
                type="button"
                data-results
              >
                Results
              </button>

            </div>

            <section class="medhmar-participants-card">

              <div class="medhmar-participants-card-head">

                <div>

                  <h2>
                    Race Participants
                  </h2>

                  <p>
                    Registered camels and their
                    participation status.
                  </p>

                </div>

              </div>

              ${
            participants.length
                ? `
                      <div class="medhmar-participants-table-wrap">

                        <table class="medhmar-participants-table">

                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Camel</th>
                              <th>Registrant</th>
                              <th>Registered</th>
                              <th>Status</th>
                            </tr>
                          </thead>

                          <tbody>

                            ${participants
                    .map(
                        participant => `
                                      <tr>

                                        <td>
                                          <strong>
                                            #${escapeHtml(
                            participant.participantNumber
                        )}
                                          </strong>
                                        </td>

                                        <td>
                                          <div class="medhmar-participant-camel">

                                            <div class="medhmar-participant-avatar">
                                              🐪
                                            </div>

                                            <div>
                                              <strong>
                                                ${escapeHtml(
                            demo
                                ? participant.camelName
                                : `Camel #${participant.camelId}`
                        )}
                                              </strong>

                                              <span>
                                                ID:
                                                ${escapeHtml(
                            participant.camelId
                        )}
                                              </span>
                                            </div>

                                          </div>
                                        </td>

                                        <td>
                                          <strong>
                                            ${escapeHtml(
                            demo
                                ? participant.registrantName
                                : `Registrant #${participant.registrantId}`
                        )}
                                          </strong>
                                        </td>

                                        <td>
                                          ${formatDate(
                            participant.registeredAt
                        )}
                                        </td>

                                        <td>
                                          <span
                                            class="
                                              medhmar-entry-status
                                              ${participantStatusClass(
                            participant.entryStatus
                        )}
                                            "
                                          >
                                            ${escapeHtml(
                            participantStatusLabel(
                                participant.entryStatus
                            )
                        )}
                                          </span>
                                        </td>

                                      </tr>
                                    `
                    )
                    .join("")}

                          </tbody>

                        </table>

                      </div>
                    `
                : `
                      <div class="medhmar-participants-empty">

                        <div class="medhmar-state-icon">
                          🐪
                        </div>

                        <h3>
                          No Participants Yet
                        </h3>

                        <p>
                          No camels have been registered
                          for this race yet.
                        </p>

                      </div>
                    `
        }

            </section>

          </section>
        `;

        container
            .querySelector("[data-back-race]")
            ?.addEventListener(
                "click",
                () => {
                    navigateRacePath(
                        `/races/${encodeURIComponent(raceId)}`
                    );
                }
            );

        container
            .querySelector("[data-overview]")
            ?.addEventListener(
                "click",
                () => {
                    navigateRacePath(
                        `/races/${encodeURIComponent(raceId)}`
                    );
                }
            );

        container
            .querySelector("[data-results]")
            ?.addEventListener(
                "click",
                () => {
                    navigateRacePath(
                        `/races/${encodeURIComponent(raceId)}/results`
                    );
                }
            );

    } catch (error) {
        const status = error?.status;

        if (status === 401 || status === 403) {
            container.innerHTML = `
              <section class="medhmar-participants-page">

                <button
                  type="button"
                  class="medhmar-back-races"
                  data-back-race
                >
                  ← Back to Race
                </button>

                <div class="medhmar-race-state">

                  <div class="medhmar-state-icon">
                    !
                  </div>

                  <h2>
                    Participants Unavailable
                  </h2>

                  <p>
                    You need permission to view
                    the participants for this race.
                  </p>

                </div>

              </section>
            `;

            container
                .querySelector("[data-back-race]")
                ?.addEventListener(
                    "click",
                    () => {
                        navigateRacePath(
                            `/races/${encodeURIComponent(raceId)}`
                        );
                    }
                );

            return;
        }

        errorState(
            container,
            error?.message ||
            "Unable to load participants."
        );
    }
}
