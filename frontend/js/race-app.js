import { raceApi } from "./race-api.js";

const HERO_IMAGE = "/assets/racing-hero.webp";

const state = {
    search: "",
    status: "",
    page: 0,
    size: 6
};

const getRaces = (...args) => {
    if (typeof raceApi.getRaces === "function") {
        return raceApi.getRaces(...args);
    }

    if (typeof raceApi.list === "function") {
        return raceApi.list(...args);
    }

    throw new Error("Race list API method is not available.");
};

const getRaceById = (id) => {
    if (typeof raceApi.getRaceById === "function") {
        return raceApi.getRaceById(id);
    }

    if (typeof raceApi.one === "function") {
        return raceApi.one(id);
    }

    throw new Error("Race details API method is not available.");
};

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

function badgeClass(status) {
    const value = String(status || "").toUpperCase();

    if (value === "OPEN" || value === "COMPLETED") {
        return "race-status success";
    }

    if (value === "SCHEDULED" || value === "CLOSED") {
        return "race-status warning";
    }

    if (value === "CANCELLED") {
        return "race-status danger";
    }

    return "race-status neutral";
}

function raceCard(race) {
    return `
    <article class="race-card-final">

      <div class="race-card-final-image">

        <img
          src="${escapeHtml(race.resultsImageUrl || HERO_IMAGE)}"
          alt="${escapeHtml(race.name)}"
        >

        <span class="${badgeClass(race.status)}">
          ${escapeHtml(race.status)}
        </span>

      </div>

      <div class="race-card-final-body">

        <h3>${escapeHtml(race.name)}</h3>

        <div class="race-card-final-meta">

          <div>
            <span>Date</span>
            <strong>${formatDate(race.startsAt)}</strong>
          </div>

          <div>
            <span>Time</span>
            <strong>${formatTime(race.startsAt)}</strong>
          </div>

          <div>
            <span>Location</span>
            <strong>${escapeHtml(race.location)}</strong>
          </div>

          <div>
            <span>Distance</span>
            <strong>${escapeHtml(race.distanceKm)} KM</strong>
          </div>

        </div>

        <div class="race-card-final-footer">

          <span>
            Race #${escapeHtml(race.raceId)}
          </span>

          <button
            class="race-primary-btn"
            type="button"
            data-view-race="${race.raceId}"
          >
            View Race
          </button>

        </div>

      </div>

    </article>
  `;
}

function loading(container) {
    container.innerHTML = `
    <section class="race-page-final">

      <div class="race-state-final">

        <div class="race-loader"></div>

        <h2>Loading...</h2>

      </div>

    </section>
  `;
}

function errorState(container, message) {
    container.innerHTML = `
    <section class="race-page-final">

      <div class="race-state-final">

        <div class="race-state-icon">!</div>

        <h2>Unable to load race data</h2>

        <p>${escapeHtml(message)}</p>

        <button
          class="race-primary-btn"
          type="button"
          data-back-races
        >
          Back to Races
        </button>

      </div>

    </section>
  `;

    container
        .querySelector("[data-back-races]")
        ?.addEventListener("click", () => {
            renderRacesListing(container);
        });
}

export function resetRaceListing() {
    state.search = "";
    state.status = "";
    state.page = 0;
    state.size = 6;
}

export async function renderRacesListing(container) {
    loading(container);

    try {
        const response = await getRaces({
            search: state.search || undefined,
            status: state.status || undefined,
            page: state.page,
            size: state.size
        });

        const races = response?.content || [];

        container.innerHTML = `
      <section class="race-page-final">

        <div class="race-breadcrumb-final">
          <span>Home</span>
          <span>/</span>
          <strong>Races</strong>
        </div>

        <div class="race-heading-final">

          <div>
            <h1>Races</h1>

            <p>
              Discover upcoming and completed camel races across MEDHMAR.
            </p>
          </div>

        </div>

        <form
          class="race-filter-final"
          id="race-filter-final"
        >

          <div class="race-search-final">

            <span>⌕</span>

            <input
              type="search"
              name="search"
              placeholder="Search races..."
              value="${escapeHtml(state.search)}"
            >

          </div>

          <select name="status">

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
                    ${state.status === status ? "selected" : ""}
                  >
                    ${status}
                  </option>
                `
            )
            .join("")}

          </select>

          <button
            type="button"
            class="race-secondary-btn"
            data-clear-races
          >
            Clear Filters
          </button>

        </form>

        <div class="race-tabs-final">

          <button
            type="button"
            data-race-status=""
            class="${state.status === "" ? "active" : ""}"
          >
            All
          </button>

          <button
            type="button"
            data-race-status="SCHEDULED"
            class="${state.status === "SCHEDULED" ? "active" : ""}"
          >
            Upcoming
          </button>

          <button
            type="button"
            data-race-status="OPEN"
            class="${state.status === "OPEN" ? "active" : ""}"
          >
            Open
          </button>

          <button
            type="button"
            data-race-status="COMPLETED"
            class="${state.status === "COMPLETED" ? "active" : ""}"
          >
            Completed
          </button>

        </div>

        <div class="race-section-title-final">

          <h2>Available Races</h2>

          <span>
            ${response?.totalElements ?? races.length}
            race${(response?.totalElements ?? races.length) === 1 ? "" : "s"}
          </span>

        </div>

        ${
            races.length
                ? `
              <div class="race-grid-final">
                ${races.map(raceCard).join("")}
              </div>
            `
                : `
              <div class="race-state-final">

                <div class="race-state-icon">
                  🏁
                </div>

                <h2>No Races Found</h2>

                <p>
                  Try changing the search or status filter.
                </p>

              </div>
            `
        }

        ${
            (response?.totalPages || 0) > 1
                ? `
              <div class="race-pagination-final">

                <button
                  type="button"
                  class="race-secondary-btn"
                  data-race-prev
                  ${response.first ? "disabled" : ""}
                >
                  Previous
                </button>

                <span>
                  Page ${response.number + 1}
                  of ${response.totalPages}
                </span>

                <button
                  type="button"
                  class="race-secondary-btn"
                  data-race-next
                  ${response.last ? "disabled" : ""}
                >
                  Next
                </button>

              </div>
            `
                : ""
        }

      </section>
    `;

        const form =
            container.querySelector("#race-filter-final");

        let searchTimer;

        form
            .querySelector('input[name="search"]')
            .addEventListener("input", event => {
                clearTimeout(searchTimer);

                searchTimer = setTimeout(() => {
                    state.search = event.target.value.trim();
                    state.page = 0;

                    renderRacesListing(container);
                }, 350);
            });

        form
            .querySelector('select[name="status"]')
            .addEventListener("change", event => {
                state.status = event.target.value;
                state.page = 0;

                renderRacesListing(container);
            });

        container
            .querySelector("[data-clear-races]")
            ?.addEventListener("click", () => {
                resetRaceListing();

                renderRacesListing(container);
            });

        container
            .querySelectorAll("[data-race-status]")
            .forEach(button => {
                button.addEventListener("click", () => {
                    state.status =
                        button.dataset.raceStatus;

                    state.page = 0;

                    renderRacesListing(container);
                });
            });

        container
            .querySelector("[data-race-prev]")
            ?.addEventListener("click", () => {
                state.page =
                    Math.max(0, state.page - 1);

                renderRacesListing(container);
            });

        container
            .querySelector("[data-race-next]")
            ?.addEventListener("click", () => {
                state.page += 1;

                renderRacesListing(container);
            });

        container
            .querySelectorAll("[data-view-race]")
            .forEach(button => {
                button.addEventListener("click", () => {
                    renderRaceDetails(
                        container,
                        Number(button.dataset.viewRace)
                    );
                });
            });

    } catch (error) {
        errorState(
            container,
            error?.message || "Unable to load races."
        );
    }
}

export async function renderRaceDetails(
    container,
    raceId
) {
    loading(container);

    try {
        const race =
            await getRaceById(raceId);

        container.innerHTML = `
      <section class="race-page-final">

        <button
          type="button"
          class="race-back-final"
          data-back-races
        >
          ← Back to Races
        </button>

        <div class="race-detail-heading-final">

          <div>

            <div class="race-detail-title-line">

              <h1>
                ${escapeHtml(race.name)}
              </h1>

              <span class="${badgeClass(race.status)}">
                ${escapeHtml(race.status)}
              </span>

            </div>

            <p>
              Race #${escapeHtml(race.raceId)}
            </p>

          </div>

          ${
            race.status === "OPEN"
                ? `
                <button
                  class="race-primary-btn"
                  type="button"
                  data-register-race="${race.raceId}"
                >
                  Register Camel
                </button>
              `
                : ""
        }

        </div>

        <div class="race-detail-hero-final">

          <img
            src="${escapeHtml(
            race.resultsImageUrl || HERO_IMAGE
        )}"
            alt="${escapeHtml(race.name)}"
          >

          <div class="race-detail-hero-meta-final">

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
                ${escapeHtml(race.distanceKm)} KM
              </strong>
            </div>

          </div>

        </div>

        <div class="race-detail-tabs-final">

          <button
            type="button"
            class="active"
          >
            Overview
          </button>

          <button
            type="button"
            data-detail-participants
          >
            Participants
          </button>

          <button
            type="button"
            data-detail-results
          >
            Results
          </button>

        </div>

        <div class="race-detail-layout-final">

          <div class="race-detail-main-final">

            <div class="race-detail-card-final">

              <h2>About the Race</h2>

              <p>
                ${escapeHtml(race.name)}
                is a MEDHMAR camel race taking place at
                ${escapeHtml(race.location)}
                over a distance of
                ${escapeHtml(race.distanceKm)} KM.
              </p>

            </div>

            <div class="race-detail-info-grid-final">

              <div class="race-detail-card-final">

                <span>Start Date</span>

                <strong>
                  ${formatDate(race.startsAt)}
                </strong>

              </div>

              <div class="race-detail-card-final">

                <span>Start Time</span>

                <strong>
                  ${formatTime(race.startsAt)}
                </strong>

              </div>

              <div class="race-detail-card-final">

                <span>Distance</span>

                <strong>
                  ${escapeHtml(race.distanceKm)} KM
                </strong>

              </div>

              <div class="race-detail-card-final">

                <span>Status</span>

                <strong>
                  ${escapeHtml(race.status)}
                </strong>

              </div>

            </div>

          </div>

          <aside
            class="race-detail-card-final race-detail-side-final"
          >

            <h3>Race Information</h3>

            <div>

              <span>Race ID</span>

              <strong>
                #${escapeHtml(race.raceId)}
              </strong>

            </div>

            <div>

              <span>Organizer ID</span>

              <strong>
                #${escapeHtml(race.organizerId)}
              </strong>

            </div>

            <div>

              <span>Organization</span>

              <strong>
                ${
            race.organizationId
                ? `#${escapeHtml(
                    race.organizationId
                )}`
                : "Independent"
        }
              </strong>

            </div>

            <div>

              <span>Location</span>

              <strong>
                ${escapeHtml(race.location)}
              </strong>

            </div>

          </aside>

        </div>

      </section>
    `;

        container
            .querySelector("[data-back-races]")
            ?.addEventListener("click", () => {
                renderRacesListing(container);
            });

        container
            .querySelector("[data-detail-participants]")
            ?.addEventListener("click", () => {
                window.history.pushState(
                    {},
                    "",
                    `/races/${race.raceId}/participants`
                );
            });

        container
            .querySelector("[data-detail-results]")
            ?.addEventListener("click", () => {
                window.history.pushState(
                    {},
                    "",
                    `/races/${race.raceId}/results`
                );
            });

        container
            .querySelector("[data-register-race]")
            ?.addEventListener("click", () => {
                window.history.pushState(
                    {},
                    "",
                    `/races/${race.raceId}/register`
                );
            });

    } catch (error) {
        errorState(
            container,
            error?.message ||
            "Unable to load race details."
        );
    }
}