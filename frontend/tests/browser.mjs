import { chromium } from "playwright";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { mockApi, user } from "./fixtures.mjs";

const base = "http://127.0.0.1:5500";
const output = new URL("../test-results/", import.meta.url).pathname;
await mkdir(output, { recursive: true });
const server = spawn(process.execPath, ["server.mjs"], {
  cwd: new URL("..", import.meta.url),
  stdio: "pipe",
});
await new Promise((resolve, reject) => {
  server.stdout.once("data", resolve);
  server.once("error", reject);
  server.once("exit", (code) =>
    reject(new Error(`Preview server exited: ${code}`)),
  );
});
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  const mocks = await mockApi(page);
  async function visit(path) {
    await page.goto(`${base}/#${path}`);
    await page.waitForFunction(
      () => !document.querySelector("main").hasAttribute("aria-busy"),
    );
    await page.waitForSelector("main h1, main .notice.error");
    assert.equal(
      await page.locator("main .notice.error").count(),
      0,
      `Error on ${path}: ${await page.locator("main").innerText()}`,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `Horizontal overflow on ${path}`,
    );
    const duplicates = await page.evaluate(() => {
      const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
      return ids.filter((id, i) => ids.indexOf(id) !== i);
    });
    assert.deepEqual(duplicates, [], `Duplicate accessible IDs on ${path}`);
  }
  async function screenshot(name) {
    await page.evaluate(() => {
      document.querySelector("#notifications").classList.remove("visible");
      const note = document.createElement("div");
      note.id = "fixture-note";
      note.textContent = "UI TEST PREVIEW · SAMPLE DATA";
      Object.assign(note.style, {
        position: "fixed",
        bottom: "8px",
        left: "8px",
        background: "#fffefb",
        border: "1px solid #795535",
        padding: "5px 10px",
        font: "10px Arial",
        color: "#53381f",
        zIndex: "999",
      });
      document.body.append(note);
    });
    await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
    await page.locator("#fixture-note").evaluate((el) => el.remove());
  }
  const paths = [
    "/",
    "/signin",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/home",
    "/races",
    "/archive",
    "/races/1",
    "/races/1/participants",
    "/races/1/results",
    "/races/2/results",
    "/races/1/register",
    "/registrations",
    "/camels",
    "/my-camels",
    "/camels/new",
    "/camels/7",
    "/camels/7/edit",
    "/camels/7/ownership",
    "/settings",
    "/trainers",
    "/trainer-profile",
    "/agreements",
    "/agreements/new",
    "/assigned",
    "/training?agreement=6",
    "/marketplace",
    "/my-listings",
    "/marketplace/new",
    "/marketplace/3",
    "/marketplace/3/edit",
    "/offers",
    "/offers/4",
    "/organizer",
    "/organizer/races/new",
    "/organizer/races/1",
    "/admin",
    "/challenges",
    "/challenges/9",
    "/assistant",
  ];
  for (const path of paths) await visit(path);
  console.log(
    `Rendered ${paths.length} routes without runtime errors, duplicate IDs or desktop overflow.`,
  );
  for (const [path, name] of [
    ["/", "landing-desktop"],
    ["/signin", "signin-desktop"],
    ["/races", "races-desktop"],
    ["/camels/7", "camel-profile-desktop"],
    ["/training?agreement=6", "training-desktop"],
  ]) {
    await visit(path);
    if (path === "/")
      await page.waitForFunction(
        () =>
          !document.querySelector("#upcoming-races")?.hasAttribute("aria-busy"),
      );
    await screenshot(name);
  }
  // Owner form sends DTO field names from the current controller, not from the image prototype.
  await visit("/camels/new");
  await page.getByLabel(/^Camel name\s*\*?$/).fill("Matar");
  await page.getByLabel(/^Date of birth\s*\*?$/).fill("2022-01-15");
  await page.getByLabel(/^Breed\s*\*?$/).fill("Omani");
  await page.getByRole("button", { name: "Save Camel", exact: true }).click();
  await page.waitForURL("**/#/camels/7");
  const camelWrite = mocks.writes.find((w) => w.path === "/camel/add");
  assert.equal(camelWrite.body.name, "Matar");
  assert.equal(camelWrite.body.status, "ACTIVE");
  assert.equal(camelWrite.body.birthDate, "2022-01-15T00:00:00.000Z");
  assert.ok(!("ownerId" in camelWrite.body));
  await visit("/training?agreement=6");
  await page
    .getByLabel(/^Session date \& time\s*\*?$/)
    .fill("2026-09-20T09:00");
  await page.getByLabel(/^Duration \(minutes\)\s*\*?$/).fill("45");
  await page.getByLabel(/^Notes\s*\*?$/).fill("Steady pace.");
  await page
    .getByRole("button", { name: "Add Training Log", exact: true })
    .click();
  await page.waitForFunction(() =>
    document.querySelector("#notifications").textContent.includes("recorded"),
  );
  const training = mocks.writes.find((w) => w.path === "/api/training-logs");
  assert.equal(training.body.agreementId, 6);
  assert.equal(training.body.durationMinutes, 45);
  assert.ok(!("distanceKm" in training.body));
  await visit("/agreements/new");
  await page.getByLabel(/^Select Mudammer\s*\*?$/).selectOption("32");
  await page.getByLabel(/^Select camel\s*\*?$/).selectOption("7");
  await page.getByLabel(/^Start date \& time\s*\*?$/).fill("2030-01-01T09:00");
  await page.getByLabel(/^End date \& time\s*\*?$/).fill("2030-06-01T09:00");
  await page
    .getByRole("button", { name: "Send Agreement", exact: true })
    .click();
  await page.waitForURL("**/#/agreements");
  assert.equal(
    mocks.writes.find((w) => w.path === "/api/agreements").body.trainerUserId,
    32,
  );
  await visit("/challenges/9");
  await page.getByRole("button", { name: "Vote", exact: true }).first().click();
  await page.waitForFunction(() =>
    document.querySelector("#notifications").textContent.includes("counted"),
  );
  assert.equal(mocks.writes.filter((w) => w.path.endsWith("/votes")).length, 1);
  assert.equal(
    await page
      .getByRole("button", { name: "Vote Recorded" })
      .first()
      .isDisabled(),
    true,
  );
  await visit("/assistant");
  await page
    .getByLabel(/^Your question\s*\*?$/)
    .fill("How can I register a camel?");
  await page
    .getByRole("button", { name: "Send Question", exact: true })
    .click();
  await page.waitForSelector(".message.user");
  assert.match(
    await page.locator("#chat-history").innerText(),
    /Owners can register/,
  );
  await visit("/offers/4");
  await page.getByRole("button", { name: "Accept Offer", exact: true }).click();
  await page.waitForFunction(() =>
    document
      .querySelector("#notifications")
      .textContent.includes("Ownership updated"),
  );
  assert.equal(
    mocks.writes.filter((w) => w.path === "/offer/4/accept").length,
    1,
  );
  // Arabic/RTL uses the same layout and routes; no hidden duplicate pages.
  await visit("/races");
  await page.getByRole("button", { name: "العربية", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.documentElement.dir === "rtl" &&
      !document.querySelector("main").hasAttribute("aria-busy"),
  );
  assert.equal(await page.locator("h1").innerText(), "جدول السباقات");
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await screenshot("races-arabic");
  await page.reload();
  await page.waitForFunction(
    () =>
      document.documentElement.dir === "rtl" &&
      !document.querySelector("main").hasAttribute("aria-busy"),
  );
  assert.equal(await page.locator("h1").innerText(), "جدول السباقات");
  await page.getByRole("button", { name: "English", exact: true }).click();
  // Small screens keep forms usable and tables scroll inside their container.
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    "/",
    "/signin",
    "/races",
    "/camels/7",
    "/training?agreement=6",
    "/admin",
    "/challenges/9",
  ])
    await visit(path);
  await visit("/");
  await screenshot("landing-mobile");
  assert.deepEqual(errors, []);
  assert.deepEqual(mocks.unexpected, []);
  await page.close();
  // Public auth and role guards, with real browser form validation and CSRF rotation.
  const auth = await browser.newPage();
  auth.on("dialog", (d) => d.accept());
  const authMocks = await mockApi(auth, { account: null });
  await auth.goto(`${base}/#/organizer`);
  await auth.waitForURL("**/#/signin?next=*");
  await auth.getByLabel(/^Email address\s*\*?$/).fill("ahmed@example.test");
  await auth.getByLabel(/^Password\s*\*?$/).fill("long-test-password");
  await auth.getByRole("button", { name: "Sign In", exact: true }).click();
  await auth.waitForURL("**/#/organizer");
  await auth.goto(`${base}/#/settings`);
  await auth.getByLabel(/^Full name\s*\*?$/).fill("Ahmed Al Badi Updated");
  await auth.getByRole("button", { name: "Save changes", exact: true }).click();
  await auth.waitForFunction(() =>
    document
      .querySelector("#notifications")
      .textContent.includes("Profile updated"),
  );
  assert.equal(
    authMocks.writes.find((w) => w.path === "/api/users/me").csrf,
    "test-csrf-2",
  );
  await auth.getByRole("button", { name: "Sign Out", exact: true }).click();
  await auth.waitForURL(`${base}/#/`);
  await auth.goto(`${base}/#/signup`);
  await auth.getByLabel(/^Full name\s*\*?$/).fill("New Owner");
  await auth.getByLabel(/^Email address\s*\*?$/).fill("new@example.test");
  await auth.getByLabel(/^Password\s*\*?$/).fill("long-test-password");
  await auth
    .getByLabel(/^Confirm password\s*\*?$/)
    .fill("does-not-match-password");
  await auth
    .getByRole("button", { name: "Create Account", exact: true })
    .click();
  await auth.waitForFunction(() =>
    document.querySelector(".form-errors").textContent.includes("do not match"),
  );
  assert.equal(
    authMocks.writes.filter((w) => w.path === "/api/auth/register").length,
    0,
  );
  await auth.getByLabel(/^Confirm password\s*\*?$/).fill("long-test-password");
  await auth
    .getByRole("button", { name: "Create Account", exact: true })
    .click();
  await auth.waitForURL(/#\/signin$/);
  assert.equal(
    authMocks.writes.filter((w) => w.path === "/api/auth/register").length,
    1,
  );
  await auth.goto(`${base}/reset-password.html#token=${"a".repeat(43)}`);
  await auth.waitForSelector('[name="confirmPassword"]');
  assert.equal(auth.url().includes("token="), false);
  await auth.getByLabel(/^Password\s*\*?$/).fill("new-long-password");
  await auth.getByLabel(/^Confirm password\s*\*?$/).fill("new-long-password");
  await auth
    .getByRole("button", { name: "Update Password", exact: true })
    .click();
  await auth.waitForURL(/#\/signin$/);
  assert.equal(
    authMocks.writes.find((w) => w.path === "/api/auth/reset-password").body
      .token,
    "a".repeat(43),
  );
  await auth.close();
  const viewer = await browser.newPage();
  await mockApi(viewer, { account: { ...user, roles: ["VIEWER"] } });
  await viewer.goto(`${base}/#/admin`);
  await viewer.getByRole("heading", { name: "Access restricted" }).waitFor();
  await viewer.close();
  const offline = await browser.newPage();
  await mockApi(offline, { failPath: "/api/races" });
  await offline.goto(`${base}/#/races`);
  await offline.getByRole("alert").waitFor();
  assert.match(
    await offline.getByRole("alert").innerText(),
    /Service unavailable/,
  );
  await offline.close();
  console.log(
    "Passed auth, reset-token handling, CSRF rotation, role guards, validation, owner/trainer forms, offer acceptance, voting, chat, RTL, mobile and error-state checks.",
  );
  console.log(`Screenshots: ${output}`);
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
