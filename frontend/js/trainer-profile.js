import { demo } from "./data.js";

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const icon = (kind) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${
    {
      arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
      pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
      track:
        '<rect x="2" y="5" width="20" height="14" rx="7"/><rect x="5" y="8" width="14" height="8" rx="4"/>',
      flag: '<path d="M4 21 7 3m0 2c5-4 7 5 14 0l-2 10c-7 5-9-4-14 0"/><path d="m9 5-1 4 4 1 1-4m-7 7 2-4m4 1-1 4m5-6-1 4 4 1"/>',
      calendar:
        '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-10 5 2 2 4-4"/>',
      age: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-10 4h4"/>',
      male: '<circle cx="9" cy="15" r="6"/><path d="m13 11 8-8m-6 0h6v6"/>',
      female: '<circle cx="12" cy="8" r="6"/><path d="M12 14v8m-4-4h8"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
    }[kind]
  }</svg>`;

// These names, ages and assignments describe the visual preview only.
// Sample IDs must never be used to open or write registered camel records.
const camels = [
  {
    id: "sample-barq",
    name: "Barq",
    breed: "Omani",
    gender: "Male",
    age: 4,
    photo: "/assets/marketplace-photos/wahiba.webp",
  },
  {
    id: "sample-shahin",
    name: "Shahin",
    breed: "Omani",
    gender: "Male",
    age: 5,
    photo: "/assets/marketplace-photos/wahiba-close.webp",
  },
  {
    id: "sample-reem",
    name: "Al Reem",
    breed: "Omani",
    gender: "Female",
    age: 3,
    photo: "/assets/marketplace-photos/salalah.webp",
  },
];
const expertise = [
  ["track", "Endurance", "Build stamina"],
  ["flag", "Race Preparation", "Prepare with purpose"],
  ["calendar", "Structured Training", "Train consistently"],
];
const photo = (src, alt, extra = "") =>
  `<div class="trainer-photo ${extra}"><span class="trainer-photo-fallback">Photo unavailable</span><img src="${src}" alt="${esc(alt)}" data-trainer-photo></div>`;
const camelCard = (camel) =>
  `<article class="trainer-camel-card">${photo(camel.photo, "Illustrative camel photograph", camel.id)}<div class="trainer-camel-body"><div class="trainer-camel-title"><h3>${esc(camel.name)}</h3><span class="trainer-breed">${esc(camel.breed)}</span></div><p class="trainer-camel-meta"><span>${icon(camel.gender === "Male" ? "male" : "female")}${camel.gender}</span><span>${icon("age")}${camel.age} years</span></p><button type="button" class="trainer-camel-action" data-trainer-camel="${camel.id}" aria-label="View ${esc(camel.name)} sample camel">View Camel ${icon("arrow")}</button></div></article>`;

export function trainerCamelPreview(id) {
  const camel = camels.find((c) => c.id === id);
  if (!camel) return null;
  return {
    title: `${camel.name} · Sample camel`,
    body: `${photo(camel.photo, "Illustrative camel photograph", "trainer-dialog-photo")}<p>${camel.breed} · ${camel.gender} · ${camel.age} years</p><p>This illustrative camel has no registered profile or recorded assignment. The photograph does not identify the named sample camel.</p><a class="btn btn-secondary" href="/camels" data-trainer-registry>Browse Camel Registry ${icon("arrow")}</a>`,
  };
}

export function trainerProfile(trainer = demo.trainer) {
  return `<section class="trainer-profile" aria-labelledby="trainer-page-title">
    <nav class="trainer-breadcrumb" aria-label="Breadcrumb"><a href="/home" data-link>Home</a><span aria-hidden="true">/</span><span aria-current="page">Trainer Profile</span></nav>
    <header class="trainer-heading"><div><h1 id="trainer-page-title">Trainer Profile</h1><p>Experience and dedication behind every performance.</p></div><span class="trainer-preview-badge">${icon("info")} Profile preview</span></header>
    <article class="trainer-profile-card" aria-label="Illustrative trainer profile">
      ${photo("/assets/trainer-profile/salim-preview.webp", "AI-generated portrait of the illustrative Omani trainer", "trainer-portrait")}
      <div class="trainer-profile-info"><div class="trainer-identity"><div><p class="trainer-eyebrow">Professional Camel Trainer</p><h2>${esc(trainer.name)}</h2><p class="trainer-location">${icon("pin")}${esc(trainer.location)}</p></div><span class="trainer-active"><span aria-hidden="true"></span>Active</span></div>
        <div class="trainer-action-row"><p>Endurance, race preparation and structured training.</p><a class="btn btn-primary" href="/training" data-link>View Training Log ${icon("arrow")}</a></div>
        <dl class="trainer-statistics"><div><dt>Assigned Camels</dt><dd>${esc(trainer.assigned)}</dd></div><div><dt>Years Experience</dt><dd>${esc(trainer.years)}</dd></div></dl>
      </div>
    </article>
    <div class="trainer-about-row"><section class="trainer-about" aria-labelledby="trainer-about-title"><p class="trainer-eyebrow">The trainer</p><h2 id="trainer-about-title">A focused approach to every race</h2><p>${esc(trainer.bio)}</p><p class="trainer-about-caption">Consistent preparation. Confident performance.</p></section>
      <section class="trainer-expertise" aria-labelledby="trainer-expertise-title"><h2 id="trainer-expertise-title">Training Expertise</h2><div class="trainer-expertise-grid">${expertise.map(([symbol, title, description]) => `<article><span class="trainer-expertise-icon">${icon(symbol)}</span><div><h3>${title}</h3><p>${description}</p></div></article>`).join("")}</div></section></div>
    <section class="trainer-assigned" aria-labelledby="trainer-assigned-title"><div class="trainer-assigned-heading"><div><div class="trainer-assigned-title"><h2 id="trainer-assigned-title">Assigned Camels</h2><span class="trainer-count">${esc(trainer.assigned)} camels</span></div><p>Three illustrative camels from this sample trainer profile.</p></div><a class="btn btn-secondary" href="/camels" data-link>Browse Registry ${icon("arrow")}</a></div><div class="trainer-camel-grid">${camels.map(camelCard).join("")}</div></section>
    <p class="trainer-preview-caption">Illustrative profile and assignment counts. Trainer portrait is AI-generated. Camel photographs do not identify the named sample camels.</p>
    <details class="trainer-photo-credits"><summary>Camel photo credits</summary><ul><li><a href="https://commons.wikimedia.org/wiki/File:Camello,_desierto_de_Wahiba,_Om%C3%A1n,_2024-08-17,_DD_19.jpg" target="_blank" rel="noopener">Camel in the Wahiba Desert</a> — Diego Delso</li><li><a href="https://commons.wikimedia.org/wiki/File:Camels_in_Wahiba_Sands_02.jpg" target="_blank" rel="noopener">Camels in Wahiba Sands 02</a> — albinfo</li><li><a href="https://commons.wikimedia.org/wiki/File:Camel_of_Oman.jpg" target="_blank" rel="noopener">Camel of Oman</a> — Desertroad</li></ul><p>Licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>. Converted to WebP and cropped for display. No endorsement implied.</p></details>
    <dialog class="trainer-preview-dialog" aria-labelledby="trainer-dialog-title"><form method="dialog"><button class="trainer-dialog-close" aria-label="Close camel preview">×</button></form><h2 id="trainer-dialog-title"></h2><div class="trainer-dialog-content"></div><form method="dialog"><button class="btn btn-primary">Close</button></form></dialog>
  </section>`;
}

export function bindTrainerProfile(root) {
  const section = root.querySelector(".trainer-profile");
  if (!section) return;
  const bindPhotos = (container) =>
    container.querySelectorAll("[data-trainer-photo]").forEach((img) => {
      const fallback = () => img.remove();
      img.addEventListener("error", fallback, { once: true });
      if (img.complete && !img.naturalWidth) fallback();
    });
  bindPhotos(section);
  const dialog = section.querySelector("dialog");
  section.addEventListener("click", (event) => {
    const button = event.target.closest("[data-trainer-camel]");
    if (button) {
      const preview = trainerCamelPreview(button.dataset.trainerCamel);
      if (!preview) return;
      section.querySelector("#trainer-dialog-title").textContent =
        preview.title;
      const content = section.querySelector(".trainer-dialog-content");
      content.innerHTML = preview.body;
      bindPhotos(content);
      dialog.showModal();
    }
    // The registry action is an ordinary navigation, not a sample record link.
    if (event.target.closest("[data-trainer-registry]")) dialog.close();
  });
}
