import test from "node:test";
import assert from "node:assert/strict";
import { MOHAMMED_ROUTES, CAMEL_MARKET_ROUTES, matchRoute, canAccessRoute } from "../js/routes.js";

test("preserves Mohammed's assigned interfaces and registers the two scoped entities", () => {
  assert.equal(MOHAMMED_ROUTES.filter((r) => r.owner === "Mohammed").length, 19);
  assert.equal(MOHAMMED_ROUTES.filter((r) => r.owner === "TrainingAgreement").length, 4);
  assert.equal(MOHAMMED_ROUTES.filter((r) => r.owner === "auditLog").length, 4);
});

test("matches Mohammed dynamic routes", () => {
  assert.equal(matchRoute("/challenges/17").route.name, "Challenge Detail + Voting");
  assert.equal(matchRoute("/pedigree").route.name, "Pedigree Directory");
  assert.equal(matchRoute("/camels/11").route.name, "Pedigree Section");
  assert.equal(matchRoute("/camels/11/pedigree/edit").route.name, "Edit Pedigree");
  assert.equal(matchRoute("/organizer/races/5/race-card").route.name, "Race Card Publish Control");
});

test("registers CRUD-oriented TrainingAgreement and auditLog routes", () => {
  const expected = {
    "/agreements": "Training Agreements", "/agreements/new": "Add Training Agreement",
    "/agreements/17": "Training Agreement Details", "/agreements/17/edit": "Edit Training Agreement",
    "/audit-logs": "Audit Logs", "/audit-logs/new": "Add Audit Log",
    "/audit-logs/21": "Audit Log Details", "/audit-logs/21/edit": "Edit Audit Log",
  };
  for (const [path, name] of Object.entries(expected)) assert.equal(matchRoute(path)?.route.name, name, path);
});

test("agreement routes allow trainers to read and accept, while audit routes are admin-only", () => {
  const agreementList = matchRoute("/agreements").route;
  const agreementDetail = matchRoute("/agreements/17").route;
  const agreementCreate = matchRoute("/agreements/new").route;
  const auditList = matchRoute("/audit-logs").route;
  const trainer = { userId: 12, roles: ["TRAINER"] };
  const owner = { userId: 13, roles: ["OWNER"] };
  const admin = { userId: 14, roles: ["ADMIN"] };

  assert.equal(canAccessRoute(agreementList, trainer), true);
  assert.equal(canAccessRoute(agreementDetail, trainer), true);
  assert.equal(canAccessRoute(agreementCreate, trainer), false);
  assert.equal(canAccessRoute(agreementCreate, owner), true);
  assert.equal(canAccessRoute(auditList, trainer), false);
  assert.equal(canAccessRoute(auditList, owner), false);
  assert.equal(canAccessRoute(auditList, admin), true);
});

test("does not expose unimplemented teammate-owned standalone modules", () => {
  for (const path of ["/my-camels","/assigned"]) {
    assert.equal(matchRoute(path), null);
  }
});


test("race screens are integrated", () => {
  const expected = {
    "/races": "Races Listing",
    "/archive": "Race Archive",
    "/races/1": "Race Details",
    "/races/1/participants": "Race Participants",
    "/races/1/results": "Race Results",
    "/races/1/register": "Race Registration",
    "/registrations": "My Registrations",
    "/organizer": "Organizer Race Dashboard",
    "/organizer/races/new": "Add Race",
    "/organizer/races/1": "Manage Race",
  };

  for (const [path, name] of Object.entries(expected)) {
    assert.equal(matchRoute(path)?.route.name, name, path);
  }

  assert.equal(matchRoute("/races/1")?.params.id, "1");
  assert.equal(matchRoute("/races/1/participants")?.params.id, "1");
  assert.equal(matchRoute("/races/1/results")?.params.id, "1");
  assert.equal(matchRoute("/races/1/register")?.params.id, "1");
  assert.equal(matchRoute("/organizer/races/1")?.params.id, "1");
});

test("race workflow access follows backend roles", () => {
  const owner = { userId: 1, roles: ["OWNER"] };
  const organizer = { userId: 2, roles: ["ORGANIZER"] };
  const viewer = { userId: 3, roles: ["VIEWER"] };
  const admin = { userId: 4, roles: ["ADMIN"] };

  assert.equal(canAccessRoute(matchRoute("/races/1/register").route, owner), true);
  assert.equal(canAccessRoute(matchRoute("/races/1/register").route, viewer), false);
  assert.equal(canAccessRoute(matchRoute("/registrations").route, owner), true);
  assert.equal(canAccessRoute(matchRoute("/organizer").route, organizer), true);
  assert.equal(canAccessRoute(matchRoute("/organizer/races/new").route, organizer), true);
  assert.equal(canAccessRoute(matchRoute("/organizer/races/1").route, owner), false);
  assert.equal(canAccessRoute(matchRoute("/organizer/races/1").route, admin), true);
});

test("Camel & Marketplace routes are registered and owned separately", () => {
  assert.equal(CAMEL_MARKET_ROUTES.length, 14);
  assert.ok(CAMEL_MARKET_ROUTES.every((r) => r.owner === "Camel & Marketplace"));
  const expected = {
    "/camels": "Camels", "/camels/my": "My Camels", "/camels/new": "Add Camel",
    "/camels/7/profile": "Camel Profile", "/camels/7/edit": "Edit Camel", "/camels/7/ownership": "Camel Ownership History",
    "/marketplace": "Marketplace", "/marketplace/new": "Create Listing", "/marketplace/my-listings": "My Listings",
    "/marketplace/history": "Listing History", "/marketplace/3": "Listing Detail", "/marketplace/3/edit": "Edit Listing",
    "/offers": "My Offers", "/offers/9": "Offer Detail",
  };
  for (const [path, name] of Object.entries(expected)) assert.equal(matchRoute(path)?.route.name, name, path);
  assert.equal(matchRoute("/marketplace/3").params.id, "3");
});

test("specific camel routes win over Mohammed's /camels/:id, which stays the Pedigree Section", () => {
  assert.equal(matchRoute("/camels/my").route.name, "My Camels");
  assert.equal(matchRoute("/camels/new").route.name, "Add Camel");
  assert.equal(matchRoute("/camels/11").route.name, "Pedigree Section");
  assert.equal(matchRoute("/marketplace/my-listings").route.name, "My Listings");
});


test("pedigree editing is limited to owner and admin roles", () => {
  const route = matchRoute("/camels/11/pedigree/edit").route;
  assert.equal(canAccessRoute(route, { userId: 1, roles: ["OWNER"] }), true);
  assert.equal(canAccessRoute(route, { userId: 2, roles: ["ADMIN"] }), true);
  assert.equal(canAccessRoute(route, { userId: 3, roles: ["VIEWER"] }), false);
  assert.equal(canAccessRoute(route, { userId: 4, roles: ["TRAINER"] }), false);
});
