import test from "node:test";
import assert from "node:assert/strict";
import {
  trainerProfile,
  trainerCamelPreview,
  bindTrainerProfile,
} from "../js/trainer-profile.js";
import { demo } from "../js/data.js";

test("trainer preview shows two metrics and contains no ratings or review controls", () => {
  const html = trainerProfile();
  assert.match(html, /Profile preview/);
  assert.match(html, /Salim Al Rashidi/);
  assert.match(html, /<dt>Assigned Camels<\/dt><dd>12<\/dd>/);
  assert.match(html, /<dt>Years Experience<\/dt><dd>8<\/dd>/);
  assert.equal((html.match(/<dt>/g) || []).length, 2);
  assert.doesNotMatch(html, /\b(?:rating|reviews?)\b|4\.8|★|⭐/i);
  assert.equal(Object.hasOwn(demo.trainer, "rating"), false);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /AI-generated/);
});

test("sample camel actions stay local while the training and registry actions use existing pages", () => {
  const html = trainerProfile();
  assert.equal((html.match(/class="trainer-camel-card"/g) || []).length, 3);
  assert.match(html, /href="\/training" data-link>View Training Log/);
  assert.match(html, /href="\/camels" data-link>Browse Registry/);
  assert.doesNotMatch(html, /href="\/camels\/|href="\/agreements\/|data-act=/);
  assert.match(html, /Three illustrative camels/);
  assert.match(html, /CC BY-SA 4\.0/);
  for (const id of ["sample-barq", "sample-shahin", "sample-reem"]) {
    const preview = trainerCamelPreview(id);
    assert.match(preview.title, /Sample camel/);
    assert.match(preview.body, /no registered profile or recorded assignment/);
    assert.doesNotMatch(preview.body, /href="\/camels\/|data-act=|<form/);
  }
  for (const id of ["41", "sample-missing", "<script>", null])
    assert.equal(trainerCamelPreview(id), null);
});

test("profile fields are escaped before they reach the DOM", () => {
  const html = trainerProfile({
    ...demo.trainer,
    name: "<script>alert(1)</script>",
    location: '" onmouseover="x',
    bio: "<img src=x onerror=x>",
    assigned: "<svg onload=x>",
    years: "<b>8</b>",
  });
  assert.doesNotMatch(html, /<script>|<img src=x|<svg onload=|<b>8/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&quot; onmouseover=&quot;x/);
  assert.match(html, /&lt;b&gt;8&lt;\/b&gt;/);
});

test("binding outside the trainer page has no side effects", () => {
  assert.doesNotThrow(() => bindTrainerProfile({ querySelector: () => null }));
});
