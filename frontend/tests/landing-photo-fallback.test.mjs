import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
const start = source.indexOf("function bindLandingPhotoFallbacks(container) {");
const end = source.indexOf("\nfunction landing(){", start);
assert.ok(start >= 0 && end > start, "photo recovery helper must be present");
const bindLandingPhotoFallbacks = new Function(
  source.slice(start, end) + "\nreturn bindLandingPhotoFallbacks;"
)();

function fakeImage(complete = false) {
  const listeners = [];
  const classes = [];
  const image = {
    dataset: { landingFallback: "/assets/mock-camels/camel-3.jpg" },
    complete, naturalWidth: complete ? 0 : 960,
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Camel_of_Oman.jpg/960px-Camel_of_Oman.jpg",
    classList: { add: name => classes.push(name) },
    addEventListener: (name, cb) => { if (name === "error") listeners.push(cb); },
  };
  return { image, listeners, classes };
}

test("failed remote photograph switches to the checked local image once", () => {
  const { image, listeners, classes } = fakeImage();
  const container = { querySelectorAll: () => [image] };
  bindLandingPhotoFallbacks(container);
  bindLandingPhotoFallbacks(container);
  assert.equal(listeners.length, 1, "do not bind multiple listeners across renders");
  listeners[0]();
  assert.equal(image.src, "/assets/mock-camels/camel-3.jpg");
  assert.equal(image.dataset.photoFallbackUsed, "true");
  listeners[0]();
  assert.deepEqual(classes, ["landing-photo-unavailable"], "avoid retry loops if local fallback is missing");
});

test("images whose failure was cached before binding recover immediately", () => {
  const { image } = fakeImage(true);
  bindLandingPhotoFallbacks({ querySelectorAll: () => [image] });
  assert.equal(image.src, "/assets/mock-camels/camel-3.jpg");
});

test("landing includes fallback sources for every real photograph", () => {
  const landing = source.slice(source.indexOf("function landing(){"), source.indexOf("const auth = authView"));
  assert.match(landing, /960px-Camel_of_Oman\.jpg/);
  assert.match(landing, /data-landing-fallback="\/assets\/landing-hero-wide\.png"/);
  assert.match(landing, /data-landing-fallback="['"]\+fallback\+['"]"/);
  assert.equal((landing.match(/'\/assets\/(?:mock-camels\/camel-[0-9]\.jpg|racing-hero\.webp)'/g)||[]).length, 4);
});
