import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
const css = await readFile(new URL("../assets/styles.css", import.meta.url), "utf8");
const landing = app.split("function landing(){")[1]?.split("const auth = authView")[0];

test("Oman line drawing is removed from landing without affecting signature content", () => {
  assert.ok(landing, "landing implementation must remain");
  assert.doesNotMatch(landing, /landing-landscape|oman-line\.svg/);
  assert.match(landing, /PEOPLE/);
  assert.match(landing, /CAMELS/);
  assert.match(landing, /OMAN/);
  assert.match(landing, /A BRIGHTER TOMORROW/);
});

test("unused landscape styles are removed without changing landing signature", () => {
  assert.doesNotMatch(css, /\.landing-landscape\{/);
  assert.match(css, /\.landing-signature\{/);
  assert.match(css, /\.landing-signature-line\{/);
});
