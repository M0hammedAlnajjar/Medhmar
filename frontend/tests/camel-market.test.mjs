import test from "node:test";
import assert from "node:assert/strict";
import {
  buildQuery, canManageCamels, normalizeRoles, fmtOmr, fmtDate, statusTone,
  toCamelPayload, toListingPayload, toOfferCreatePayload, toOfferUpdatePayload, isFullOwner, isHttpUrl,
} from "../js/format.js";

test("buildQuery drops empty values and encodes the rest", () => {
  assert.equal(buildQuery({ page: 0, size: 12, search: " Al Barq ", breed: "", gender: undefined }), "?page=0&size=12&search=Al+Barq");
  assert.equal(buildQuery({}), "");
});

test("role helpers follow backend rules (OWNER/ADMIN may write camels and listings)", () => {
  assert.deepEqual(normalizeRoles(["ROLE_OWNER", "VIEWER"]), ["OWNER", "VIEWER"]);
  assert.equal(canManageCamels({ userId: 1, roles: ["OWNER"] }), true);
  assert.equal(canManageCamels({ userId: 1, roles: ["ADMIN"] }), true);
  assert.equal(canManageCamels({ userId: 1, roles: ["VIEWER", "TRAINER"] }), false);
  assert.equal(canManageCamels({ roles: ["OWNER"] }), false); // guest
});

test("camel payload matches CamelDTO and only adds camelId on update", () => {
  const f = { name: " Al Barq ", gender: "MALE", birthDate: "2022-05-10", breed: "Omani", photoUrl: "", sire: "Shaheen", dam: "", category: "Racing", status: "ACTIVE" };
  assert.deepEqual(toCamelPayload(f), { name: "Al Barq", gender: "MALE", birthDate: "2022-05-10T00:00:00.000Z", breed: "Omani", photoUrl: null, sire: "Shaheen", dam: null, category: "Racing", status: "ACTIVE" });
  assert.equal(toCamelPayload(f, "5").camelId, 5);
  assert.equal("camelId" in toCamelPayload(f), false);
});

test("listing and offer payloads send numbers, not strings", () => {
  assert.deepEqual(toListingPayload({ askingPriceOmr: "2500", description: " Racing camel ", camelId: "1" }), { askingPriceOmr: 2500, description: "Racing camel", camelId: 1 });
  assert.equal(toListingPayload({ askingPriceOmr: "2750", description: "abc", camelId: "1" }, "4").listingId, 4);
  assert.deepEqual(toOfferCreatePayload("2600", "1"), { offeredPriceOmr: 2600, listingId: 1 });
  assert.deepEqual(toOfferUpdatePayload("2650", "9"), { offerId: 9, offeredPriceOmr: 2650 });
});

test("formatting and status helpers", () => {
  assert.equal(fmtOmr(2600), "2,600 OMR");
  assert.equal(fmtOmr(null), "—");
  assert.equal(fmtDate("2026-10-06T08:57:56.776Z"), "2026-10-06");
  assert.equal(fmtDate(null), "—");
  assert.equal(statusTone("AVAILABLE"), "success");
  assert.equal(statusTone("PENDING"), "warning");
  assert.equal(statusTone("DECLINED"), "danger");
  assert.equal(statusTone("SOLD"), "neutral");
  assert.equal(isFullOwner([{ sharePercent: 100 }]), true);
  assert.equal(isFullOwner([{ sharePercent: 50 }, { sharePercent: 50 }]), false);
  assert.equal(isHttpUrl("javascript:alert(1)"), false);
  assert.equal(isHttpUrl("https://example.com/a.jpg"), true);
});
