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
  { path: "/admin", name: "Admin Dashboard", owner: "Mohammed", roles: ["ADMIN"] },
  { path: "/camels/:id", name: "Pedigree Section", owner: "Mohammed" },
  { path: "/organizer/races/:id/race-card", name: "Race Card Publish Control", owner: "Mohammed" },
  { path: "/organizations", name: "Organizations UI", owner: "Mohammed" },
  { path: "/tourism", name: "Tourism / Cultural Content UI", owner: "Mohammed" },
  { path: "/race-cards", name: "Race Card Public / History UI", owner: "Mohammed" },
];

export function normalizePath() {
  if (location.hash?.startsWith("#/")) return location.hash.slice(1);
  if (location.pathname === "/reset-password.html") return "/reset-password";
  return location.pathname || "/";
}

export function matchRoute(path) {
  for (const route of MOHAMMED_ROUTES) {
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
