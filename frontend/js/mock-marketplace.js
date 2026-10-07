// TEMPORARY MOCK DATA for visually testing the Marketplace UI without the backend.
// To DISABLE: set ENABLE_MOCK_MARKETPLACE = false below.
// To REMOVE entirely: delete this file and the lines in js/app.js marked "mock-marketplace".
// While enabled, the Marketplace page shows ONLY these listings (real API listings are not requested),
// and mock listing detail pages (ids 9001+) never call the backend.
export const ENABLE_MOCK_MARKETPLACE = true;

export const MOCK_ID_START = 9001;

// Simple inline SVG "photo" (desert gradient + camel silhouette); allowed by the CSP (img-src data:).
function art(sky1, sky2, dune, camel) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient></defs><rect width="400" height="240" fill="url(#g)"/><circle cx="320" cy="55" r="26" fill="#fff" opacity=".55"/><path d="M0 190 Q100 150 200 185 T400 170 V240 H0Z" fill="${dune}"/><g stroke="${camel}" fill="${camel}" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="190" cy="135" rx="62" ry="26"/><ellipse cx="178" cy="106" rx="20" ry="18"/><path d="M240 128 L268 82" stroke-width="16" fill="none"/><ellipse cx="282" cy="74" rx="20" ry="10" transform="rotate(-15 282 74)"/><path d="M136 140 Q112 150 118 176" stroke-width="5" fill="none"/><path d="M150 152V196M176 156V198M214 156V198M236 150V194" stroke-width="9" fill="none"/></g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const ago = (years, months = 0) => {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - years, d.getUTCMonth() - months, 15);
  return d.toISOString();
};
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

// [camel fields, listing fields]
const SEED = [
  [{ name: "Al Barq", gender: "MALE", birth: ago(4), breed: "Omani", category: "Racing", sire: "Shaheen", dam: "Noor", art: ["#f6d9a8", "#f0b878", "#e3a35f", "#5a3c28"] },
   { price: 8500, status: "AVAILABLE", desc: "Fast Omani racing male with strong endurance and a clean race record. Calm temperament, easy to handle.", d: 2 }],
  [{ name: "Najm", gender: "MALE", birth: ago(5, 3), breed: "Sudani", category: "Racing", sire: "Raad", dam: "Hessa", art: ["#f4e1c1", "#e8c08c", "#d9a064", "#4a3020"] },
   { price: 12000, status: "AVAILABLE", desc: "Experienced Sudani racer, three seasons of training. Excellent speed over 5 km and 8 km.", d: 5 }],
  [{ name: "Layali", gender: "FEMALE", birth: ago(3, 6), breed: "Omani", category: "Breeding", sire: "Al Sahab", dam: "Mazna", art: ["#fbe6cf", "#f2c9a0", "#e0aa7a", "#6b4a35"] },
   { price: 4200, status: "AVAILABLE", desc: "Healthy young female from proven bloodlines, suitable for breeding. Registered pedigree available.", d: 7 }],
  [{ name: "Al Sahab", gender: "MALE", birth: ago(6), breed: "Majaheem", category: "Show", sire: "Zayed", dam: "Badriya", art: ["#e9dccb", "#cdb08a", "#b58f62", "#3b281d"] },
   { price: 15000, status: "AVAILABLE", desc: "Striking dark Majaheem with show-quality conformation. Multiple festival placings.", d: 9 }],
  [{ name: "Ghazal", gender: "FEMALE", birth: ago(2, 2), breed: "Arabian", category: "Racing", sire: "Hazaa", dam: "Shamsa", art: ["#fde8c8", "#f5c690", "#e6a76c", "#5c3d2a"] },
   { price: 3600, status: "AVAILABLE", desc: "Promising young filly just starting light training. Good build, quick learner.", d: 12 }],
  [{ name: "Rayyan", gender: "MALE", birth: ago(7, 1), breed: "Omani", category: "Racing", sire: "Al Barq", dam: "Fatma", art: ["#f1dcc0", "#dcb283", "#c99a68", "#4d3322"] },
   { price: 6800, status: "AVAILABLE", desc: "Seasoned racer in great condition, retired from the heavy circuit. Ideal for local events.", d: 15 }],
  [{ name: "Hazaa", gender: "MALE", birth: ago(1, 8), breed: "Sudani", category: "Racing", sire: "Najm", dam: "Ghazal", art: ["#f9e5c9", "#efc896", "#dfaa73", "#6a4a36"] },
   { price: 2400, status: "AVAILABLE", desc: "Young Sudani male with strong bloodlines. Vaccinated and vet-checked, ready for training.", d: 18 }],
  [{ name: "Shahin", gender: "MALE", birth: ago(4, 5), breed: "Omani", category: "Racing", sire: "Raad", dam: "Noor", art: ["#ecdcc4", "#d3b184", "#bd9462", "#43301f"] },
   { price: 9200, status: "SOLD", desc: "Champion-line Omani racer. Sold to a private owner in Al Dakhiliyah.", d: 30 }],
];

export const MOCK_CAMELS = {};
export const MOCK_LISTINGS = SEED.map(([c, l], i) => {
  const camelId = 9101 + i;
  MOCK_CAMELS[camelId] = { camelId, name: c.name, gender: c.gender, birthDate: c.birth, breed: c.breed, photoUrl: `/assets/mock-camels/camel-${i + 1}.jpg`, sire: c.sire, dam: c.dam, category: c.category, status: l.status === "SOLD" ? "SOLD" : "ACTIVE" };
  return { listingId: MOCK_ID_START + i, askingPriceOmr: l.price, status: l.status, description: l.desc, camelId, userId: 9999, createdAt: daysAgo(l.d) };
});

export const isMockListingId = (id) => ENABLE_MOCK_MARKETPLACE && MOCK_LISTINGS.some((l) => String(l.listingId) === String(id));
export const getMockListing = (id) => MOCK_LISTINGS.find((l) => String(l.listingId) === String(id)) || null;

// Same shape as the real PageResponse<MarketPlaceDTO>.
export function mockMarketplacePage({ page = 0, size = 12, search, minPrice, maxPrice } = {}) {
  const s = String(search || "").trim().toLowerCase();
  const rows = MOCK_LISTINGS.filter((l) => {
    const camel = MOCK_CAMELS[l.camelId];
    return (!s || l.description.toLowerCase().includes(s) || camel.name.toLowerCase().includes(s))
      && (minPrice === undefined || minPrice === "" || l.askingPriceOmr >= Number(minPrice))
      && (maxPrice === undefined || maxPrice === "" || l.askingPriceOmr <= Number(maxPrice));
  });
  const p = Number(page) || 0, n = Number(size) || 12;
  return { content: rows.slice(p * n, p * n + n), page: p, size: n, totalElements: rows.length, totalPages: Math.ceil(rows.length / n) };
}

