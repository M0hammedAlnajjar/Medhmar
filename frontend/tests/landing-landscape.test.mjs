import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const svg = await readFile(new URL("../assets/oman-line.svg", import.meta.url), "utf8");
const css = await readFile(new URL("../assets/styles.css", import.meta.url), "utf8");

test("Oman landscape stays sharp with prominent vector contours", () => {
  assert.match(svg, /<svg\b[^>]+viewBox="0 0 420 92"/);
  assert.match(svg, /stroke="#95532E" stroke-width="3\.25"/);
  assert.match(svg, /stroke="#AE7245" stroke-width="2"/);
  assert.match(svg, /Omani mountains, date palms and a fort/);
  assert.match(svg, /M18 76C38/);
  assert.match(svg, /M282 80V43/);
  assert.match(svg, /M336 80V53/);
});

test("landscape remains legible on desktops and medium screens", () => {
  assert.match(css, /\.landing-landscape\{[^\n]+width:210px;height:51px;[^\n]+opacity:1/);
  assert.match(css, /\.landing-landscape\{width:165px;height:42px/);
  assert.match(css, /\.landing-landscape\{display:none\}/);
});
