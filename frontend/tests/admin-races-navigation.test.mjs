import test from "node:test";
import assert from "node:assert/strict";
import { matchRoute, canAccessRoute } from "../js/routes.js";
import { adminShell } from "../js/admin-console.js";

const user = role => ({ userId: 1, fullName: "Test User", roles: [role] });

test("admin races route is restricted to admins", () => {
  const route = matchRoute("/admin/races")?.route;
  assert.ok(route);
  assert.equal(route.name, "Admin Races");
  assert.equal(canAccessRoute(route, user("ADMIN")), true);
  for (const role of ["VIEWER", "OWNER", "TRAINER", "ORGANIZER"]) {
    assert.equal(canAccessRoute(route, user(role)), false);
  }
});

test("admin sidebar stays identical when navigating from Dashboard to Races", () => {
  const dashboard = adminShell({
    user: user("ADMIN"),
    active: "/admin",
    body: "<p>Dashboard</p>"
  });
  const races = adminShell({
    user: user("ADMIN"),
    active: "/admin/races",
    body: "<p>Race management</p>"
  });
  const sidebarHrefs = html => {
    const nav = html.match(/<nav class="admin-sidebar-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1] || "";
    return [...nav.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  };
  const expected = [
    "/admin",
    "/admin/users",
    "/admin/marketplace",
    "/admin/termination-requests",
    "/admin/heritage",
    "/admin/challenges",
    "/admin/organizations",
    "/admin/system-health",
    "/admin/audit-logs",
    "/admin/races",
    "/admin/settings"
  ];
  assert.deepEqual(sidebarHrefs(dashboard), expected);
  assert.deepEqual(sidebarHrefs(races), expected);
  assert.match(races, /href="\/admin\/races" data-link class="active"/);
  assert.match(races, /data-admin-layout="races"/);
  assert.doesNotMatch(races, /Back to Website/);
  assert.equal((races.match(/href="\/admin\/settings"/g) || []).length, 2);
});
