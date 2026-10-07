import { raceApi } from "./race-api.js";

const HERO_IMAGE = "/assets/racing-hero.webp";

const DEMO_RACES = [
    {
        raceId: "demo-nizwa",
        name: "Nizwa Heritage Race",
        startsAt: "2026-10-18T03:30:00Z",
        location: "Nizwa, Oman",
        distanceKm: 6,
        status: "SCHEDULED",
        resultsImageUrl: HERO_IMAGE,
        organizerId: null,
        organizationId: null,
        organizerName: "Nizwa Racing Club",
        trackType: "Sand Track",
        category: "Heritage Race"
    },
    {
        raceId: "demo-salalah",
        name: "Salalah Summer Race",
        startsAt: "2026-10-25T02:00:00Z",
        location: "Salalah, Oman",
        distanceKm: 8,
        status: "SCHEDULED",
        resultsImageUrl: HERO_IMAGE,
        organizerId: null,
        organizationId: null,
        organizerName: "Dhofar Racing",
        trackType: "Sand Track",
        category: "Open Race"
    },
    {
        raceId: "demo-muscat",
        name: "Muscat Desert Sprint",
        startsAt: "2026-10-10T03:00:00Z",
        location: "Muscat, Oman",
        distanceKm: 5,
        status: "OPEN",
        resultsImageUrl: HERO_IMAGE,
        organizerId: null,
        organizationId: null,
        organizerName: "Muscat Camel Racing",
        trackType: "Sand Track",
        category: "Sprint Race"
    },
    {
        raceId: "demo-sohar",
        name: "Sohar Heritage Cup",
        startsAt: "2026-09-28T03:00:00Z",
        location: "Sohar, Oman",
        distanceKm: 7,
        status: "COMPLETED",
        resultsImageUrl: HERO_IMAGE,
        organizerId: null,
        organizationId: null,
        organizerName: "Al Batinah Racing",
        trackType: "Sand Track",
        category: "Heritage Cup"
    }
];

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

function isDemoRace(id) {
    return String(id).startsWith("demo-");
}

function findDemoRace(id) {
    return DEMO_RACES.find(
        race => String(race.raceId) === String(id)
    );
}

async function fetchBackendRaces() {
    if (backendLoaded) {
        return backendCache;
    }

    backendLoaded = true;

    try {
        let response;

        if (typeof raceApi.getRaces === "function") {
            if (raceApi.getRaces.length >= 4) {
                response = await raceApi.getRaces(
                    "",
                    "",
                    0,
                    100
                );
            } else {
                response = await raceApi.getRaces({
                    page: 0,
                    size: 100
                });
            }
        } else if (typeof raceApi.list === "function") {
            response = await raceApi.list({
                page: 0,
                size: 100
            });
        } else {
            throw new Error(
                "Race list API method is not available."
            );
        }

        backendCache = Array.isArray(response)
            ? response
            : response?.content || [];
    } catch {
        backendCache = [];
    }

    return backendCache;
}

async function getRaceById(id) {
    const demoRace = findDemoRace(id);

    if (demoRace) {
        return demoRace;
    }

    if (typeof raceApi.getRaceById === "function") {
        return raceApi.getRaceById(id);
    }

    if (typeof raceApi.one === "function") {
        return raceApi.one(id);
    }

    throw new Error(
        "Race details API method is not available."
    );
}

async function getAllRaces() {
    const backendRaces = await fetchBackendRaces();

    return [
        ...backendRaces.map(race => ({
            ...race,
            organizerName:
                race.organizerName ||
                (
                    race.organizerId
                        ? `Organizer #${race.organizerId}`
                        : "MEDHMAR Organizer"
                )
        })),
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
        return (
            status === "COMPLETED" ||
            status === "CLOSED"
        );
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
            String(race.status).toUpperCase() !==
            state.status
        ) {
            return false;
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
          src="${escapeHtml(
        race.resultsImageUrl || HERO_IMAGE
    )}"
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
            ${escapeHtml(
        statusLabel(race.status)
    )}
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
            ${escapeHtml(
        race.organizerName
    )}
          </span>

        </div>

      </div>

      <div class="medhmar-race-action">

        <button
          type="button"
          class="medhmar-view-race"
          data-view-race="${escapeHtml(
        race.raceId
    )}"
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

        <h2>Loading races...</h2>

      </div>

    </section>
  `;
}

function errorState(
    container,
    message
) {
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
        .querySelector(
            "[data-back-races]"
        )
        ?.addEventListener(
            "click",
            () => {
                renderRacesListing(
                    container
                );
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

export async function renderRacesListing(
    container
) {
    loading(container);

    const races = await getAllRaces();

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
                .map(race =>
                    dateKey(race.startsAt)
                )
                .filter(Boolean)
        )
    ].sort();

    const filtered =
        filterRaces(races);

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filtered.length /
                state.size
            )
        );

    if (
        state.page >= totalPages
    ) {
        state.page = 0;
    }

    const pageStart =
        state.page * state.size;

    const pageItems =
        filtered.slice(
            pageStart,
            pageStart +
            state.size
        );

    container.innerHTML = `
    <section class="medhmar-races-page">

      <div class="medhmar-races-heading">

        <h1>Races</h1>

      </div>

      <div class="medhmar-race-filters">

        <label
          class="
            medhmar-race-search
          "
        >

          <span>⌕</span>

          <input
            type="search"
            id="race-search"
            placeholder="Search races..."
            value="${escapeHtml(
        state.search
    )}"
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
                state.date ===
                value
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

        <select
          id="race-location"
        >

          <option value="">
            Location
          </option>

          ${locations
        .map(
            location => `
                <option
                  value="${escapeHtml(
                location
            )}"
                  ${
                state.location ===
                location
                    ? "selected"
                    : ""
            }
                >
                  ${escapeHtml(
                location
            )}
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
                state.status ===
                status
                    ? "selected"
                    : ""
            }
                >
                  ${statusLabel(
                status
            )}
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
        state.tab ===
        "upcoming"
            ? "active"
            : ""
    }"
        >
          Upcoming
          <span>
            ${tabCount(
        races,
        "upcoming"
    )}
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
            ${tabCount(
        races,
        "live"
    )}
          </span>
        </button>

        <button
          type="button"
          data-tab="completed"
          class="${
        state.tab ===
        "completed"
            ? "active"
            : ""
    }"
        >
          Completed
          <span>
            ${tabCount(
        races,
        "completed"
    )}
          </span>
        </button>

      </div>

      <div class="medhmar-race-list">

        ${
        pageItems.length
            ? pageItems
                .map(
                    (race, index) =>
                        raceRow(
                            race,
                            index
                        )
                )
                .join("")
            : `
              <div
                class="
                  medhmar-race-state
                "
              >

                <div
                  class="
                    medhmar-state-icon
                  "
                >
                  🏁
                </div>

                <h2>
                  No Races Found
                </h2>

                <p>
                  Try changing your
                  search or filters.
                </p>

              </div>
            `
    }

      </div>

      ${
        totalPages > 1
            ? `
            <div
              class="
                medhmar-race-pagination
              "
            >

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
                state.page + 1 >=
                totalPages
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

    let searchTimer;

    container
        .querySelector(
            "#race-search"
        )
        ?.addEventListener(
            "input",
            event => {
                clearTimeout(
                    searchTimer
                );

                searchTimer =
                    setTimeout(
                        () => {
                            state.search =
                                event.target.value
                                    .trim();

                            state.page = 0;

                            renderRacesListing(
                                container
                            );
                        },
                        250
                    );
            }
        );

    container
        .querySelector(
            "#race-date"
        )
        ?.addEventListener(
            "change",
            event => {
                state.date =
                    event.target.value;

                state.page = 0;

                renderRacesListing(
                    container
                );
            }
        );

    container
        .querySelector(
            "#race-location"
        )
        ?.addEventListener(
            "change",
            event => {
                state.location =
                    event.target.value;

                state.page = 0;

                renderRacesListing(
                    container
                );
            }
        );

    container
        .querySelector(
            "#race-status"
        )
        ?.addEventListener(
            "change",
            event => {
                state.status =
                    event.target.value;

                state.page = 0;

                renderRacesListing(
                    container
                );
            }
        );

    container
        .querySelectorAll(
            "[data-tab]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    state.tab =
                        button.dataset.tab;

                    state.page = 0;

                    renderRacesListing(
                        container
                    );
                }
            );
        });

    container
        .querySelectorAll(
            "[data-view-race]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    renderRaceDetails(
                        container,
                        button.dataset
                            .viewRace
                    );
                }
            );
        });

    container
        .querySelector(
            "[data-page-prev]"
        )
        ?.addEventListener(
            "click",
            () => {
                state.page =
                    Math.max(
                        0,
                        state.page - 1
                    );

                renderRacesListing(
                    container
                );
            }
        );

    container
        .querySelector(
            "[data-page-next]"
        )
        ?.addEventListener(
            "click",
            () => {
                state.page += 1;

                renderRacesListing(
                    container
                );
            }
        );
}

export async function renderRaceDetails(
    container,
    raceId
) {
    loading(container);

    try {
        const race =
            await getRaceById(
                raceId
            );

        container.innerHTML = `
      <section
        class="
          medhmar-race-details
        "
      >

        <button
          type="button"
          class="
            medhmar-back-races
          "
          data-back-races
        >
          ← Back to Races
        </button>

        <div
          class="
            medhmar-detail-heading
          "
        >

          <div>

            <div
              class="
                medhmar-detail-title
              "
            >

              <h1>
                ${escapeHtml(
            race.name
        )}
              </h1>

              <span
                class="
                  medhmar-race-status
                  ${statusClass(
            race.status
        )}
                "
              >
                ${escapeHtml(
            statusLabel(
                race.status
            )
        )}
              </span>

            </div>

            <p>
              ${
            isDemoRace(
                race.raceId
            )
                ? "Demo Race"
                : `Race #${escapeHtml(
                    race.raceId
                )}`
        }
            </p>

          </div>

          ${
            race.status ===
            "OPEN"
                ? `
                <button
                  type="button"
                  class="
                    medhmar-view-race
                  "
                >
                  Register Camel
                </button>
              `
                : ""
        }

        </div>

        <div
          class="
            medhmar-detail-hero
          "
        >

          <img
            src="${escapeHtml(
            race.resultsImageUrl ||
            HERO_IMAGE
        )}"
            alt="${escapeHtml(
            race.name
        )}"
          >

          <div
            class="
              medhmar-detail-hero-meta
            "
          >

            <div>
              <span>Date</span>
              <strong>
                ${formatDate(
            race.startsAt
        )}
              </strong>
            </div>

            <div>
              <span>Time</span>
              <strong>
                ${formatTime(
            race.startsAt
        )}
              </strong>
            </div>

            <div>
              <span>Location</span>
              <strong>
                ${escapeHtml(
            race.location
        )}
              </strong>
            </div>

            <div>
              <span>Distance</span>
              <strong>
                ${escapeHtml(
            race.distanceKm
        )}
                KM
              </strong>
            </div>

          </div>

        </div>

        <div
          class="
            medhmar-detail-tabs
          "
        >

          <button
            type="button"
            class="active"
          >
            Overview
          </button>

          <button type="button">
            Participants
          </button>

          <button type="button">
            Results
          </button>

        </div>

        <div
          class="
            medhmar-detail-layout
          "
        >

          <div
            class="
              medhmar-detail-main
            "
          >

            <article
              class="
                medhmar-detail-card
              "
            >

              <h2>
                About the Race
              </h2>

              <p>
                ${escapeHtml(
            race.name
        )}
                is a MEDHMAR camel
                race taking place at
                ${escapeHtml(
            race.location
        )}
                over a distance of
                ${escapeHtml(
            race.distanceKm
        )}
                KM.
              </p>

            </article>

            <div
              class="
                medhmar-detail-grid
              "
            >

              <article
                class="
                  medhmar-detail-card
                "
              >
                <span>
                  Start Date
                </span>
                <strong>
                  ${formatDate(
            race.startsAt
        )}
                </strong>
              </article>

              <article
                class="
                  medhmar-detail-card
                "
              >
                <span>
                  Start Time
                </span>
                <strong>
                  ${formatTime(
            race.startsAt
        )}
                </strong>
              </article>

              <article
                class="
                  medhmar-detail-card
                "
              >
                <span>
                  Distance
                </span>
                <strong>
                  ${escapeHtml(
            race.distanceKm
        )}
                  KM
                </strong>
              </article>

              <article
                class="
                  medhmar-detail-card
                "
              >
                <span>
                  Status
                </span>
                <strong>
                  ${escapeHtml(
            statusLabel(
                race.status
            )
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

            <div>
              <span>Category</span>
              <strong>
                ${escapeHtml(
            race.category ||
            "Camel Race"
        )}
              </strong>
            </div>

            <div>
              <span>Track Type</span>
              <strong>
                ${escapeHtml(
            race.trackType ||
            "Sand Track"
        )}
              </strong>
            </div>

            <div>
              <span>Organizer</span>
              <strong>
                ${escapeHtml(
            race.organizerName ||
            (
                race.organizerId
                    ? `Organizer #${race.organizerId}`
                    : "MEDHMAR"
            )
        )}
              </strong>
            </div>

            <div>
              <span>Location</span>
              <strong>
                ${escapeHtml(
            race.location
        )}
              </strong>
            </div>

          </aside>

        </div>

      </section>
    `;

        container
            .querySelector(
                "[data-back-races]"
            )
            ?.addEventListener(
                "click",
                () => {
                    renderRacesListing(
                        container
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