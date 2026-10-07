// Pure helpers for the Camel / Marketplace / Offer screens (no DOM access, unit-tested in tests/camel-market.test.mjs).

export const GENDERS = ["MALE", "FEMALE"];
export const CAMEL_STATUSES = ["ACTIVE", "INACTIVE", "RETIRED", "SOLD"];

export function buildQuery(params = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).trim() !== "") q.set(k, String(v).trim());
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const normalizeRoles = (roles = []) => roles.map((r) => String(r).replace(/^ROLE_/, ""));
export const hasAnyRole = (user, ...wanted) => normalizeRoles(user?.roles).some((r) => wanted.includes(r));
// Backend: /camel/** and /marketplace/** writes require OWNER or ADMIN.
export const canManageCamels = (user) => Boolean(user?.userId) && hasAnyRole(user, "OWNER", "ADMIN");

export function fmtOmr(value) {
  const n = Number(value);
  if (value === null || value === undefined || Number.isNaN(n)) return "—";
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 3 })} OMR`;
}

export function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toISOString().slice(0, 10);
}

export const statusTone = (s) =>
  ["ACTIVE", "AVAILABLE", "ACCEPTED"].includes(s) ? "success"
  : ["PENDING"].includes(s) ? "warning"
  : ["DECLINED", "CANCELLED"].includes(s) ? "danger"
  : "neutral";

export const isHttpUrl = (u) => /^https?:\/\//i.test(String(u || ""));

// CamelDTO payload. camelId only on update; empty optional text becomes null.
export function toCamelPayload(f, camelId) {
  const opt = (v) => (String(v ?? "").trim() === "" ? null : String(v).trim());
  const payload = {
    name: String(f.name || "").trim(),
    gender: f.gender,
    birthDate: f.birthDate ? `${f.birthDate}T00:00:00.000Z` : null,
    breed: String(f.breed || "").trim(),
    photoUrl: opt(f.photoUrl),
    sire: opt(f.sire),
    dam: opt(f.dam),
    category: opt(f.category),
    status: f.status,
  };
  return camelId ? { camelId: Number(camelId), ...payload } : payload;
}

// MarketPlaceDTO payload (listingId only on update).
export function toListingPayload(f, listingId) {
  const payload = {
    askingPriceOmr: Number(f.askingPriceOmr),
    description: String(f.description || "").trim(),
    camelId: Number(f.camelId),
  };
  return listingId ? { listingId: Number(listingId), ...payload } : payload;
}

// OfferDTO payload: create sends listingId; update sends offerId. Price is always numeric.
export const toOfferCreatePayload = (price, listingId) => ({ offeredPriceOmr: Number(price), listingId: Number(listingId) });
export const toOfferUpdatePayload = (price, offerId) => ({ offerId: Number(offerId), offeredPriceOmr: Number(price) });

export const isFullOwner = (owners = []) => owners.length === 1 && Number(owners[0].sharePercent) >= 99.999;

// data:image/svg+xml is allowed so the temporary mock marketplace can use inline artwork (rendered via <img>, so no scripts run).
export const isSafeImageSrc = (u) => isHttpUrl(u) || /^data:image\/svg\+xml/i.test(String(u || "")) || /^\/assets\/mock-camels\/camel-\d+\.jpg$/i.test(String(u || ""));

// "3 yrs" / "1 yr" / "8 mo" from a birth date. Empty string when unknown or in the future.
export function ageLabel(birthDate, now = Date.now()) {
  const b = new Date(birthDate), n = new Date(now);
  if (!birthDate || Number.isNaN(b.getTime())) return "";
  let months = (n.getUTCFullYear() - b.getUTCFullYear()) * 12 + (n.getUTCMonth() - b.getUTCMonth());
  if (n.getUTCDate() < b.getUTCDate()) months -= 1;
  if (months < 0) return "";
  const years = Math.floor(months / 12);
  if (years < 1) return months < 1 ? "<1 mo" : `${months} mo`;
  return `${years} ${years === 1 ? "yr" : "yrs"}`;
}

const titleCase = (v) => (v ? String(v).charAt(0).toUpperCase() + String(v).slice(1).toLowerCase() : "");
// "Omani • Male • 3 yrs" from a CamelDTO (skips missing parts).
export const camelMeta = (c, now) => (c ? [c.breed, titleCase(c.gender), ageLabel(c.birthDate, now)].filter(Boolean).join(" • ") : "");

