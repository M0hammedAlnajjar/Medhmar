import test from "node:test";
import assert from "node:assert/strict";
import { MOHAMMED_ROUTES, CAMEL_MARKET_ROUTES, matchRoute } from "../js/routes.js";

test("contains exactly Mohammed's 17 assigned interface groups", () => {
  assert.equal(MOHAMMED_ROUTES.length, 17);
  assert.ok(MOHAMMED_ROUTES.every((r) => r.owner === "Mohammed"));
});

test("matches Mohammed dynamic routes", () => {
  assert.equal(matchRoute("/challenges/17").route.name, "Challenge Detail + Voting");
  assert.equal(matchRoute("/camels/11").route.name, "Pedigree Section");
  assert.equal(matchRoute("/organizer/races/5/race-card").route.name, "Race Card Publish Control");
});

test("does not expose teammate-owned standalone modules", () => {
  for (const path of ["/races","/archive","/my-camels","/agreements","/assigned"]) {
    assert.equal(matchRoute(path), null);
  }
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
