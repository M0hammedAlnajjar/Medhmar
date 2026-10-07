import { SULAIMAN_RACE_ROUTES } from "./race-routes.js";

export const MOHAMMED_ROUTES = [
  { path: "/", name: "Landing / Entry Page", owner: "Mohammed" },
  { path: "/signin", name: "Sign In", owner: "Mohammed" },
  { path: "/signup", name: "Create Account", owner: "Mohammed" },
  { path: "/forgot-password", name: "Forgot Password", owner: "Mohammed" },
  { path: "/reset-password", name: "Reset Password", owner: "Mohammed" },
  { path: "/home", name: "Home / Overview", owner: "Mohammed" },
  { path: "/settings", name: "Settings / User Profile", owner: "Mohammed" },
  { path: "/trainer-profile", name: "Trainer Profile", owner: "Mohammed" },
  { path: "/challenges", name: "Challenges", owner: "Mohammed" },
  { path: "/challenges/:id", name: "Challenge Detail + Voting", owner: "Mohammed" },
  { path: "/training", name: "Training Log", owner: "Mohammed" },
  { path: "/agreements", name: "Training Agreements", owner: "TrainingAgreement", roles: ["ADMIN", "OWNER", "TRAINER"] },
  { path: "/agreements/new", name: "Add Training Agreement", owner: "TrainingAgreement", roles: ["ADMIN", "OWNER"] },
  { path: "/agreements/:id/edit", name: "Edit Training Agreement", owner: "TrainingAgreement", roles: ["ADMIN", "OWNER"] },
  { path: "/agreements/:id", name: "Training Agreement Details", owner: "TrainingAgreement", roles: ["ADMIN", "OWNER", "TRAINER"] },
  { path: "/audit-logs", name: "Audit Logs", owner: "auditLog", roles: ["ADMIN"] },
  { path: "/audit-logs/new", name: "Add Audit Log", owner: "auditLog", roles: ["ADMIN"] },
  { path: "/audit-logs/:id/edit", name: "Edit Audit Log", owner: "auditLog", roles: ["ADMIN"] },
  { path: "/audit-logs/:id", name: "Audit Log Details", owner: "auditLog", roles: ["ADMIN"] },
  { path: "/admin", name: "Admin Dashboard", owner: "Mohammed", roles: ["ADMIN"] },
  { path: "/camels/:id", name: "Pedigree Section", owner: "Mohammed" },
  { path: "/organizer/races/:id/race-card", name: "Race Card Publish Control", owner: "Mohammed" },
  { path: "/organizations", name: "Organizations UI", owner: "Mohammed" },
  { path: "/tourism", name: "Tourism / Cultural Content UI", owner: "Mohammed" },
  { path: "/race-cards", name: "Race Card Public / History UI", owner: "Mohammed" },
];

// Camel / Ownership / Marketplace / Offer / Sale scope. Listed BEFORE Mohammed's routes so that
// "/camels/my" and "/camels/new" are not swallowed by his "/camels/:id" (Pedigree Section), which stays untouched.
// The camel profile lives at "/camels/:id/profile" and links to the Pedigree Section at "/camels/:id".
export const CAMEL_MARKET_ROUTES = [
  { path: "/camels", name: "Camels", owner: "Camel & Marketplace" },
  { path: "/camels/my", name: "My Camels", owner: "Camel & Marketplace" },
  { path: "/camels/new", name: "Add Camel", owner: "Camel & Marketplace" },
  { path: "/camels/:id/profile", name: "Camel Profile", owner: "Camel & Marketplace" },
  { path: "/camels/:id/edit", name: "Edit Camel", owner: "Camel & Marketplace" },
  { path: "/camels/:id/ownership", name: "Camel Ownership History", owner: "Camel & Marketplace" },
  { path: "/marketplace", name: "Marketplace", owner: "Camel & Marketplace" },
  { path: "/marketplace/new", name: "Create Listing", owner: "Camel & Marketplace" },
  { path: "/marketplace/my-listings", name: "My Listings", owner: "Camel & Marketplace" },
  { path: "/marketplace/history", name: "Listing History", owner: "Camel & Marketplace" },
  { path: "/marketplace/:id", name: "Listing Detail", owner: "Camel & Marketplace" },
  { path: "/marketplace/:id/edit", name: "Edit Listing", owner: "Camel & Marketplace" },
  { path: "/offers", name: "My Offers", owner: "Camel & Marketplace" },
  { path: "/offers/:id", name: "Offer Detail", owner: "Camel & Marketplace" },
];

const INTEGRATED_RACE_ROUTES = SULAIMAN_RACE_ROUTES.filter(
    route =>
        route.path === "/races" ||
        route.path === "/races/:id" ||
        route.path === "/races/:id/participants"
);


export const ALL_ROUTES = [
  ...CAMEL_MARKET_ROUTES,
  ...INTEGRATED_RACE_ROUTES,
  ...MOHAMMED_ROUTES
];


export function normalizePath() {
  if (location.hash?.startsWith("#/")) return location.hash.slice(1);
  if (location.pathname === "/reset-password.html") return "/reset-password";
  return location.pathname || "/";
}

export function matchRoute(path) {
  for (const route of ALL_ROUTES) {
    const pattern = route.path
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/:([a-zA-Z]+)/g, "(?<$1>[^/]+)");
    const match = path.match(new RegExp(`^${pattern}/?$`));
    if (match) return { route, params: match.groups || {} };
  }
  return null;
}


// Navigation visibility and route rendering use the same deny-by-default policy.
// The backend remains the authority for every protected API operation.
export function canAccessRoute(route, user) {
  if (!route?.roles) return true;
  return Boolean(user?.userId) && Array.isArray(user.roles)
    && route.roles.some(role => user.roles.includes(role));
}
