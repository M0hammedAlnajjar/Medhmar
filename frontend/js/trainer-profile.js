import { adminApi, apiAssetUrl, authApi, trainerApi } from "./api.js";

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
);

const photo = (src, name) => {
  const resolvedSrc = apiAssetUrl(src);
  return `<div class="trainer-photo trainer-portrait"><span class="trainer-photo-fallback">Photo unavailable</span>${resolvedSrc ? `<img src="${esc(resolvedSrc)}" alt="${esc(name)}" data-trainer-photo>` : ""}</div>`;
};

export function trainerProfile() {
  return `<section class="trainer-profile" aria-labelledby="trainer-page-title">
    <nav class="trainer-breadcrumb" aria-label="Breadcrumb"><a href="/home" data-link>Home</a><span aria-hidden="true">/</span><span aria-current="page">Trainer Profile</span></nav>
    <header class="trainer-heading"><div><h1 id="trainer-page-title">Trainer Profile</h1><p>Experience and dedication behind every performance.</p></div><span class="trainer-preview-badge">Medhmar trainer profiles</span></header>
    <div class="trainer-directory-results" data-trainer-results role="status" aria-live="polite"><p>Loading trainer profiles…</p></div>
  </section>`;
}

async function adminTrainerUsers() {
  const users = [];
  let pageNumber = 0;
  let page;
  do {
    page = await adminApi.users(pageNumber);
    if (!Array.isArray(page?.content)) throw new Error("Unable to load trainer accounts.");
    users.push(...page.content);
    pageNumber += 1;
  } while (pageNumber < Number(page.totalPages || 1));
  return users.filter((user) => Array.isArray(user.roles) && user.roles.includes("TRAINER") && user.accountStatus === "ACTIVE");
}

function renderProfiles(container, users, profiles, uploadUserId = null) {
  const profileById = new Map(profiles.map((profile) => [String(profile.userId), profile]));
  const cards = users.map((user) => {
    const profile = profileById.get(String(user.userId)) || { userId: user.userId, bio: null, location: null };
    const name = profile.trainerName || user.fullName || `Trainer #${profile.userId}`;
    const isOwnTrainer = String(uploadUserId) === String(profile.userId);
    const uploadForm = isOwnTrainer
      ? `<form class="trainer-photo-upload" data-trainer-photo-upload data-trainer-user-id="${esc(profile.userId)}"><label>Upload profile photo<input type="file" name="photo" accept="image/jpeg,image/png" required></label><button class="btn btn-secondary" type="submit">Upload Photo</button><p data-photo-upload-status role="status"></p></form>`
      : "";
    return `<article class="trainer-directory-entry">
      <div class="trainer-profile-card" aria-label="Trainer profile for ${esc(name)}">
        ${photo(user.avatarUrl, name)}
        <div class="trainer-profile-info"><div class="trainer-identity"><div><p class="trainer-eyebrow">Professional Camel Trainer</p><h2>${esc(name)}</h2><p class="trainer-id">Trainer ID: ${esc(profile.userId)}</p><p class="trainer-location" data-profile-location>${esc(profile.location || "Location not provided")}</p></div></div>
          <div class="trainer-action-row"><p>Trainer profile information from Medhmar.</p></div>
          ${isOwnTrainer ? `<form class="trainer-location-edit" data-trainer-location-edit data-trainer-user-id="${esc(profile.userId)}"><label>Location<input type="text" name="location" maxlength="150" value="${esc(profile.location || "")}" placeholder="Add your location"></label><label>Bio<textarea name="bio" maxlength="2000" rows="3" placeholder="Tell users about your training experience">${esc(profile.bio || "")}</textarea></label><button class="btn btn-secondary" type="submit">Save Profile Details</button><p data-location-status role="status"></p></form>` : ""}
          ${uploadForm}
        </div>
      </div>
      <div class="trainer-about-row"><section class="trainer-about"><p class="trainer-eyebrow">The trainer</p><h2>Trainer Profile</h2><p data-trainer-bio>${esc(profile.bio || "Trainer profile details have not been added yet.")}</p></section>
        <section class="trainer-expertise"><h2>Profile Details</h2><div class="trainer-expertise-grid"><article><span class="trainer-expertise-icon" aria-hidden="true">⌖</span><div><h3>Location</h3><p data-profile-location>${esc(profile.location || "Not provided")}</p></div></article><article><span class="trainer-expertise-icon" aria-hidden="true">ℹ</span><div><h3>Bio</h3><p data-profile-bio>${esc(profile.bio || "Not provided")}</p></div></article></div></section></div>
    </article>`;
  }).join("");
  container.innerHTML = cards || "<p>No trainer profiles are available.</p>";
  container.querySelectorAll("[data-trainer-photo]").forEach((img) => {
    const fallback = () => img.remove();
    img.addEventListener("error", fallback, { once: true });
    if (img.complete && !img.naturalWidth) fallback();
  });
}

function bindTrainerPhoto(img) {
  if (!img) return;
  const fallback = () => img.remove();
  img.addEventListener("error", fallback, { once: true });
  if (img.complete && !img.naturalWidth) fallback();
}

export function bindTrainerProfile(root) {
  const container = root.querySelector("[data-trainer-results]");
  if (!container) return;
  const profilesForForm = new WeakMap();
  container.addEventListener("submit", async (event) => {
    const locationForm = event.target.closest("[data-trainer-location-edit]");
    if (locationForm) {
      event.preventDefault();
      const profile = profilesForForm.get(locationForm);
      const location = locationForm.elements.location.value.trim();
      const bio = locationForm.elements.bio.value.trim();
      const button = locationForm.querySelector("button[type=submit]");
      const status = locationForm.querySelector("[data-location-status]");
      button.disabled = true;
      status.textContent = "Saving profile details…";
      try {
        const payload = { bio: bio || null, location: location || null };
        if (profile.profileCreated) await trainerApi.update(payload);
        else await trainerApi.create(payload);
        profile.location = location || null;
        profile.bio = bio || null;
        profile.profileCreated = true;
        const entry = locationForm.closest(".trainer-directory-entry");
        entry?.querySelectorAll("[data-profile-location]").forEach((el) => { el.textContent = location || "Location not provided"; });
        const bioDetails = entry?.querySelector("[data-profile-bio]");
        if (bioDetails) bioDetails.textContent = bio || "Not provided";
        const aboutBio = entry?.querySelector("[data-trainer-bio]");
        if (aboutBio) aboutBio.textContent = bio || "Trainer profile details have not been added yet.";
        if (!entry?.querySelector("[data-trainer-photo-upload]")) {
          const upload = document.createElement("form");
          upload.className = "trainer-photo-upload";
          upload.setAttribute("data-trainer-photo-upload", "");
          upload.innerHTML = '<label>Upload profile photo<input type="file" name="photo" accept="image/jpeg,image/png" required></label><button class="btn btn-secondary" type="submit">Upload Photo</button><p data-photo-upload-status role="status"></p>';
          locationForm.insertAdjacentElement("afterend", upload);
        }
        status.textContent = "Profile details saved.";
      } catch (error) {
        status.textContent = error?.message || "Profile details could not be saved.";
      } finally {
        button.disabled = false;
      }
      return;
    }
    const form = event.target.closest("[data-trainer-photo-upload]");
    if (!form) return;
    event.preventDefault();
    const file = form.elements.photo.files?.[0];
    const button = form.querySelector("button[type=submit]");
    const status = form.querySelector("[data-photo-upload-status]");
    if (!file) return;
    const profile = profilesForForm.get(form);
    button.disabled = true;
    status.textContent = "Uploading photo…";
    try {
      if (!profile.profileCreated) {
        await trainerApi.create({});
        profile.profileCreated = true;
      }
      const photoUrl = await trainerApi.uploadPhoto(file);
      const entry = form.closest(".trainer-directory-entry");
      const portrait = entry?.querySelector(".trainer-portrait");
      if (portrait) {
        portrait.innerHTML = `<span class="trainer-photo-fallback">Photo unavailable</span><img src="${esc(apiAssetUrl(photoUrl))}" alt="Trainer profile photo" data-trainer-photo>`;
        bindTrainerPhoto(portrait.querySelector("[data-trainer-photo]"));
      }
      form.reset();
      status.textContent = "Profile photo updated.";
    } catch (error) {
      status.textContent = error?.message || "Photo upload failed.";
    } finally {
      button.disabled = false;
    }
  });
  (async () => {
    try {
      const [user, profiles] = await Promise.all([
        authApi.me().catch(() => null),
        trainerApi.active(),
      ]);
      if (!Array.isArray(profiles)) throw new Error("Trainer profiles could not be loaded.");
      if (Array.isArray(user?.roles) && user.roles.includes("ADMIN")) {
        const users = await adminTrainerUsers();
        const uploadUserId = user.roles.includes("TRAINER") ? user.userId : null;
        profiles.forEach((profile) => { profile.trainerName ||= users.find((account) => String(account.userId) === String(profile.userId))?.fullName; });
        renderProfiles(container, users, profiles, uploadUserId);
      } else {
        const publicTrainers = profiles.map((profile) => {
          const isSelf = String(profile.userId) === String(user?.userId);
          return {
            userId: profile.userId,
            fullName: profile.trainerName || (isSelf && user?.fullName) || `Trainer #${profile.userId}`,
            avatarUrl: profile.avatarUrl || (isSelf ? user?.avatarUrl : null),
          };
        });
        const uploadUserId = user?.roles?.includes("TRAINER") ? user.userId : null;
        renderProfiles(container, publicTrainers, profiles, uploadUserId);
      }
      container.querySelectorAll("[data-trainer-location-edit], [data-trainer-photo-upload]").forEach((form) => {
        const profile = profiles.find((item) => String(item.userId) === form.dataset.trainerUserId);
        if (profile) profilesForForm.set(form, profile);
      });
    } catch (error) {
      container.innerHTML = `<p role="alert">${esc(error?.message || "Trainer profiles could not be loaded.")}</p>`;
    }
  })();
}
