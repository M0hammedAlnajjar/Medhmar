import test from "node:test";
import assert from "node:assert/strict";
import { matchRoute, canAccessRoute } from "../js/routes.js";
import { adminShell, mountAdminScreen } from "../js/admin-console.js";

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
  assert.doesNotMatch(races, /data-admin-layout="races"/);
  assert.match(races, /<header class="admin-topbar">/);
  assert.match(races, /<footer class="admin-footer">/);
  assert.match(dashboard, /<header class="admin-topbar">/);
  assert.doesNotMatch(races, /Back to Website/);
  assert.equal((races.match(/href="\/admin\/settings"/g) || []).length, 2);
});

test("admin shell mounting preserves the sidebar menu's scroll offset", () => {
  const root = {
    currentNav: {scrollTop: 164},
    get innerHTML() { return this.html; },
    set innerHTML(html) { this.html = html; this.currentNav = {scrollTop: 0}; },
    querySelector(selector) { return selector === '.admin-sidebar-nav' ? this.currentNav : null; }
  };
  mountAdminScreen(root, adminShell({user: user("ADMIN"), active: "/admin/races", body: "Races"}));
  assert.equal(root.currentNav.scrollTop, 164);
  mountAdminScreen(root, adminShell({user: user("ADMIN"), active: "/admin/challenges", body: "Challenges"}));
  assert.equal(root.currentNav.scrollTop, 164);
  assert.match(root.innerHTML, /href="\/admin\/challenges" data-link class="active"/);
});
