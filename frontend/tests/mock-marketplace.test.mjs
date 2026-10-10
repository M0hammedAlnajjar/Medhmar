import test from "node:test";
import assert from "node:assert/strict";
import { ENABLE_MOCK_MARKETPLACE, MOCK_LISTINGS, MOCK_CAMELS, mockMarketplacePage, isMockListingId, getMockListing } from "../js/mock-marketplace.js";

test("mock marketplace has 8 listings with ids from 9001 and matching camels", () => {
  assert.equal(MOCK_LISTINGS.length, 8);
  assert.deepEqual(MOCK_LISTINGS.map((l) => l.listingId), [9001, 9002, 9003, 9004, 9005, 9006, 9007, 9008]);
  for (const l of MOCK_LISTINGS) {
    const c = MOCK_CAMELS[l.camelId];
    assert.ok(c.name && c.breed && c.gender && c.birthDate && /^\/assets\/mock-camels\/camel-\d+\.jpg$/.test(c.photoUrl));
    assert.ok(l.askingPriceOmr > 0 && l.description.length >= 3 && l.description.length <= 255);
  }
});

test("mock page has the real PageResponse shape and filters", () => {
  const page = mockMarketplacePage({ page: 0, size: 12 });
  assert.deepEqual(Object.keys(page), ["content", "page", "size", "totalElements", "totalPages"]);
  assert.equal(page.totalElements, 8);
  assert.equal(mockMarketplacePage({ search: "barq" }).totalElements, 1);
  assert.ok(mockMarketplacePage({ minPrice: "9000" }).content.every((l) => l.askingPriceOmr >= 9000));
  assert.equal(mockMarketplacePage({ page: 1, size: 5 }).content.length, 3);
});

test("mock id helpers only recognise mock ids (real ids still use the API)", () => {
  assert.equal(isMockListingId(9001), ENABLE_MOCK_MARKETPLACE);
  assert.equal(isMockListingId(1), false);
  assert.equal(getMockListing("9003").camelId, 9103);
  assert.equal(getMockListing(1), null);
});

test("ageLabel, camelMeta and image-source helpers used by the marketplace cards", async () => {
  const { ageLabel, camelMeta, isSafeImageSrc } = await import("../js/format.js");
  const now = Date.parse("2026-10-07T00:00:00Z");
  assert.equal(ageLabel("2022-05-10T00:00:00Z", now), "4 yrs");
  assert.equal(ageLabel("2025-10-01T00:00:00Z", now), "1 yr");
  assert.equal(ageLabel("2026-02-01T00:00:00Z", now), "8 mo");
  assert.equal(ageLabel(null, now), "");
  assert.equal(ageLabel("2030-01-01T00:00:00Z", now), "");
  assert.equal(camelMeta({ breed: "Omani", gender: "MALE", birthDate: "2022-05-10T00:00:00Z" }, now), "Omani • Male • 4 yrs");
  assert.equal(camelMeta(null), "");
  assert.equal(isSafeImageSrc("data:image/svg+xml;charset=utf-8,%3Csvg"), true);
  assert.equal(isSafeImageSrc("data:text/html,<script>"), false);
  assert.equal(isSafeImageSrc("https://example.com/a.jpg"), true);
});


test("real marketplace is the default when no browser demo setting exists", () => {
  assert.equal(ENABLE_MOCK_MARKETPLACE, false);
  assert.equal(isMockListingId(9001), false);
});

test("mock camel IDs are recognized independently of demo activation", async () => {
  const { isMockCamelId } = await import("../js/mock-marketplace.js");
  assert.equal(isMockCamelId(9101), true);
  assert.equal(isMockCamelId(1), false);
});
