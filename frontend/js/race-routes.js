export const SULAIMAN_RACE_ROUTES = [
    {
        path: "/races",
        name: "Races Listing",
        owner: "Sulaiman"
    },
    {
        path: "/archive",
        name: "Race Archive",
        owner: "Sulaiman"
    },
    {
        path: "/races/:id",
        name: "Race Details",
        owner: "Sulaiman"
    },
    {
        path: "/races/:id/participants",
        name: "Race Participants",
        owner: "Sulaiman"
    },
    {
        path: "/races/:id/results",
        name: "Race Results",
        owner: "Sulaiman"
    },
    {
        path: "/races/:id/register",
        name: "Race Registration",
        owner: "Sulaiman"
    },
    {
        path: "/registrations",
        name: "My Registrations",
        owner: "Sulaiman"
    },
    {
        path: "/organizer",
        name: "Organizer Race Dashboard",
        owner: "Sulaiman"
    },
    {
        path: "/organizer/races/new",
        name: "Add Race",
        owner: "Sulaiman"
    },
    {
        path: "/organizer/races/:id",
        name: "Manage Race",
        owner: "Sulaiman"
    }
];

export function matchRaceRoute(path) {
    for (const route of SULAIMAN_RACE_ROUTES) {
        const pattern = route.path
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            .replace(/:([a-zA-Z]+)/g, "(?<$1>[^/]+)");

        const match = path.match(
            new RegExp(`^${pattern}/?$`)
        );

        if (match) {
            return {
                route,
                params: match.groups || {}
            };
        }
    }

    return null;
}