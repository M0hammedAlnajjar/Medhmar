import { raceApi } from "./race-api.js";

const raceState = {
    search: "",
    status: "",
    page: 0,
    size: 10,
    totalPages: 0,
    totalElements: 0,
    races: [],
    loading: false,
    error: null
};

const raceStatusLabels = {
    SCHEDULED: "UPCOMING",
    OPEN: "OPEN",
    CLOSED: "CLOSED",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED"
};

function escapeHtml(value = "") {
    return String(value).replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#039;"
        })[character]
    );
}

function formatRaceDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
}

function formatRaceTime(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

function statusBadge(status) {
    const label =
        raceStatusLabels[status] ||
        status;

    return `
        <span class="race-status-badge race-status-${status.toLowerCase()}">
            ${escapeHtml(label)}
        </span>
    `;
}

function raceCard(race) {
    return `
        <article class="sulaiman-race-card">

            <div class="sulaiman-race-image">
                <img
                    src="/assets/racing-hero.webp"
                    alt="${escapeHtml(race.name)}"
                >

                <div class="sulaiman-race-card-status">
                    ${statusBadge(race.status)}
                </div>
            </div>

            <div class="sulaiman-race-content">

                <h3 class="sulaiman-race-title">
                    ${escapeHtml(race.name)}
                </h3>

                <div class="sulaiman-race-information">

                    <div class="sulaiman-race-info-item">
                        <span class="sulaiman-race-info-icon">
                            ◷
                        </span>

                        <div>
                            <span class="sulaiman-race-info-label">
                                Date
                            </span>

                            <strong>
                                ${formatRaceDate(race.startsAt)}
                            </strong>
                        </div>
                    </div>

                    <div class="sulaiman-race-info-item">
                        <span class="sulaiman-race-info-icon">
                            ⏱
                        </span>

                        <div>
                            <span class="sulaiman-race-info-label">
                                Time
                            </span>

                            <strong>
                                ${formatRaceTime(race.startsAt)}
                            </strong>
                        </div>
                    </div>

                    <div class="sulaiman-race-info-item">
                        <span class="sulaiman-race-info-icon">
                            ⌖
                        </span>

                        <div>
                            <span class="sulaiman-race-info-label">
                                Location
                            </span>

                            <strong>
                                ${escapeHtml(race.location)}
                            </strong>
                        </div>
                    </div>

                    <div class="sulaiman-race-info-item">
                        <span class="sulaiman-race-info-icon">
                            ↔
                        </span>

                        <div>
                            <span class="sulaiman-race-info-label">
                                Distance
                            </span>

                            <strong>
                                ${escapeHtml(race.distanceKm)} KM
                            </strong>
                        </div>
                    </div>

                </div>

                <div class="sulaiman-race-footer">

                    <span class="sulaiman-race-organizer">
                        Race #${escapeHtml(race.raceId)}
                    </span>

                    <a
                        class="sulaiman-race-view-button"
                        href="/races/${race.raceId}"
                        data-race-link
                    >
                        View Race
                    </a>

                </div>

            </div>

        </article>
    `;
}

function loadingCards() {
    return Array
        .from({ length: 6 })
        .map(
            () => `
                <article class="sulaiman-race-card sulaiman-race-skeleton">

                    <div class="sulaiman-skeleton-image"></div>

                    <div class="sulaiman-race-content">

                        <div class="sulaiman-skeleton-line sulaiman-skeleton-title"></div>

                        <div class="sulaiman-skeleton-line"></div>

                        <div class="sulaiman-skeleton-line"></div>

                        <div class="sulaiman-skeleton-line sulaiman-skeleton-short"></div>

                    </div>

                </article>
            `
        )
        .join("");
}

function emptyState() {
    return `
        <section class="sulaiman-race-state">

            <div class="sulaiman-race-state-icon">
                ◌
            </div>

            <h2>
                No Races Found
            </h2>

            <p>
                No races match your current search or status filter.
            </p>

            <button
                type="button"
                class="sulaiman-race-primary-button"
                id="race-clear-empty"
            >
                Clear Filters
            </button>

        </section>
    `;
}

function errorState() {
    return `
        <section class="sulaiman-race-state">

            <div class="sulaiman-race-state-icon">
                !
            </div>

            <h2>
                Unable to Load Races
            </h2>

            <p>
                ${
        escapeHtml(
            raceState.error?.message ||
            "Race information could not be loaded."
        )
    }
            </p>

            <button
                type="button"
                class="sulaiman-race-primary-button"
                id="race-retry"
            >
                Try Again
            </button>

        </section>
    `;
}

function racesContent() {
    if (raceState.loading) {
        return `
            <div class="sulaiman-race-grid">
                ${loadingCards()}
            </div>
        `;
    }

    if (raceState.error) {
        return errorState();
    }

    if (raceState.races.length === 0) {
        return emptyState();
    }

    return `
        <div class="sulaiman-race-results-header">

            <div>
                <h2>
                    Available Races
                </h2>

                <p>
                    ${raceState.totalElements}
                    ${
        raceState.totalElements === 1
            ? "race"
            : "races"
    }
                </p>
            </div>

        </div>

        <div class="sulaiman-race-grid">
            ${raceState.races.map(raceCard).join("")}
        </div>

        ${pagination()}
    `;
}

function pagination() {
    if (raceState.totalPages <= 1) {
        return "";
    }

    const pageButtons = [];

    for (
        let page = 0;
        page < raceState.totalPages;
        page++
    ) {
        pageButtons.push(`
            <button
                type="button"
                class="
                    sulaiman-page-button
                    ${
            raceState.page === page
                ? "active"
                : ""
        }
                "
                data-race-page="${page}"
            >
                ${page + 1}
            </button>
        `);
    }

    return `
        <nav
            class="sulaiman-race-pagination"
            aria-label="Race pagination"
        >

            <button
                type="button"
                class="sulaiman-page-button sulaiman-page-navigation"
                data-race-page="${raceState.page - 1}"
                ${
        raceState.page === 0
            ? "disabled"
            : ""
    }
            >
                Previous
            </button>

            ${pageButtons.join("")}

            <button
                type="button"
                class="sulaiman-page-button sulaiman-page-navigation"
                data-race-page="${raceState.page + 1}"
                ${
        raceState.page >= raceState.totalPages - 1
            ? "disabled"
            : ""
    }
            >
                Next
            </button>

        </nav>
    `;
}

function racesListingTemplate() {
    return `
        <section class="sulaiman-races-page">

            <div class="sulaiman-race-page-header">

                <div>

                    <div class="sulaiman-race-breadcrumb">
                        Home
                        <span>/</span>
                        Races
                    </div>

                    <h1>
                        Races
                    </h1>

                    <p>
                        Discover upcoming and completed camel races
                        across MEDHMAR.
                    </p>

                </div>

            </div>

            <section class="sulaiman-race-toolbar">

                <div class="sulaiman-race-search">

                    <span class="sulaiman-race-search-icon">
                        ⌕
                    </span>

                    <input
                        id="race-search-input"
                        type="search"
                        value="${escapeHtml(raceState.search)}"
                        placeholder="Search races..."
                        aria-label="Search races"
                    >

                </div>

                <select
                    id="race-status-filter"
                    class="sulaiman-race-filter"
                    aria-label="Filter by status"
                >

                    <option value="">
                        Status
                    </option>

                    <option
                        value="SCHEDULED"
                        ${
        raceState.status === "SCHEDULED"
            ? "selected"
            : ""
    }
                    >
                        Upcoming
                    </option>

                    <option
                        value="OPEN"
                        ${
        raceState.status === "OPEN"
            ? "selected"
            : ""
    }
                    >
                        Open
                    </option>

                    <option
                        value="CLOSED"
                        ${
        raceState.status === "CLOSED"
            ? "selected"
            : ""
    }
                    >
                        Closed
                    </option>

                    <option
                        value="COMPLETED"
                        ${
        raceState.status === "COMPLETED"
            ? "selected"
            : ""
    }
                    >
                        Completed
                    </option>

                    <option
                        value="CANCELLED"
                        ${
        raceState.status === "CANCELLED"
            ? "selected"
            : ""
    }
                    >
                        Cancelled
                    </option>

                </select>

                <button
                    type="button"
                    class="sulaiman-race-clear-button"
                    id="race-clear-filters"
                >
                    Clear Filters
                </button>

            </section>

            <div class="sulaiman-race-tabs">

                <button
                    type="button"
                    class="
                        sulaiman-race-tab
                        ${
        raceState.status === ""
            ? "active"
            : ""
    }
                    "
                    data-race-status=""
                >
                    All
                </button>

                <button
                    type="button"
                    class="
                        sulaiman-race-tab
                        ${
        raceState.status === "SCHEDULED"
            ? "active"
            : ""
    }
                    "
                    data-race-status="SCHEDULED"
                >
                    Upcoming
                </button>

                <button
                    type="button"
                    class="
                        sulaiman-race-tab
                        ${
        raceState.status === "OPEN"
            ? "active"
            : ""
    }
                    "
                    data-race-status="OPEN"
                >
                    Open
                </button>

                <button
                    type="button"
                    class="
                        sulaiman-race-tab
                        ${
        raceState.status === "COMPLETED"
            ? "active"
            : ""
    }
                    "
                    data-race-status="COMPLETED"
                >
                    Completed
                </button>

            </div>

            <div id="sulaiman-races-content">
                ${racesContent()}
            </div>

        </section>
    `;
}

function updateContent() {
    const content =
        document.querySelector(
            "#sulaiman-races-content"
        );

    if (!content) {
        return;
    }

    content.innerHTML =
        racesContent();

    bindDynamicEvents();
}

async function loadRaces() {
    raceState.loading = true;
    raceState.error = null;

    updateContent();

    try {
        const response =
            await raceApi.getRaces(
                raceState.search,
                raceState.status,
                raceState.page,
                raceState.size
            );

        raceState.races =
            response.content || [];

        raceState.totalPages =
            response.totalPages || 0;

        raceState.totalElements =
            response.totalElements || 0;
    } catch (error) {
        raceState.error = error;
        raceState.races = [];
        raceState.totalPages = 0;
        raceState.totalElements = 0;
    } finally {
        raceState.loading = false;

        updateContent();
    }
}

function clearRaceFilters() {
    raceState.search = "";
    raceState.status = "";
    raceState.page = 0;

    const searchInput =
        document.querySelector(
            "#race-search-input"
        );

    const statusFilter =
        document.querySelector(
            "#race-status-filter"
        );

    if (searchInput) {
        searchInput.value = "";
    }

    if (statusFilter) {
        statusFilter.value = "";
    }

    refreshRaceTabs();
    loadRaces();
}

function refreshRaceTabs() {
    document
        .querySelectorAll(
            "[data-race-status]"
        )
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.raceStatus ===
                raceState.status
            );
        });
}

function bindDynamicEvents() {
    document
        .querySelectorAll(
            "[data-race-page]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    if (button.disabled) {
                        return;
                    }

                    raceState.page =
                        Number(
                            button.dataset.racePage
                        );

                    loadRaces();

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });
                }
            );
        });

    document
        .querySelector(
            "#race-retry"
        )
        ?.addEventListener(
            "click",
            loadRaces
        );

    document
        .querySelector(
            "#race-clear-empty"
        )
        ?.addEventListener(
            "click",
            clearRaceFilters
        );
}

function bindRaceListingEvents() {
    let searchTimeout;

    document
        .querySelector(
            "#race-search-input"
        )
        ?.addEventListener(
            "input",
            event => {
                clearTimeout(
                    searchTimeout
                );

                searchTimeout =
                    setTimeout(
                        () => {
                            raceState.search =
                                event.target.value;

                            raceState.page = 0;

                            loadRaces();
                        },
                        400
                    );
            }
        );

    document
        .querySelector(
            "#race-status-filter"
        )
        ?.addEventListener(
            "change",
            event => {
                raceState.status =
                    event.target.value;

                raceState.page = 0;

                refreshRaceTabs();
                loadRaces();
            }
        );

    document
        .querySelector(
            "#race-clear-filters"
        )
        ?.addEventListener(
            "click",
            clearRaceFilters
        );

    document
        .querySelectorAll(
            "[data-race-status]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    raceState.status =
                        button.dataset.raceStatus;

                    raceState.page = 0;

                    const statusFilter =
                        document.querySelector(
                            "#race-status-filter"
                        );

                    if (statusFilter) {
                        statusFilter.value =
                            raceState.status;
                    }

                    refreshRaceTabs();
                    loadRaces();
                }
            );
        });

    bindDynamicEvents();
}

export function renderRacesListing(
    container
) {
    if (!container) {
        throw new Error(
            "Race listing container is required."
        );
    }

    container.innerHTML =
        racesListingTemplate();

    bindRaceListingEvents();

    loadRaces();
}

export function resetRaceListing() {
    raceState.search = "";
    raceState.status = "";
    raceState.page = 0;
    raceState.totalPages = 0;
    raceState.totalElements = 0;
    raceState.races = [];
    raceState.loading = false;
    raceState.error = null;
}