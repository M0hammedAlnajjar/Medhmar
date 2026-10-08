import { access, readFile, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";

// Parse the original modules before checking routes. VM tests strip imports,
// so invalid syntax on an import line can otherwise pass those tests.
for (const file of (await readdir("js")).filter(name => name.endsWith(".js"))) {
  execFileSync(process.execPath, ["--check", `js/${file}`], { stdio: "inherit" });
}

const required = [
  "index.html", "server.mjs", "package.json",
  "assets/styles.css", "assets/race-styles.css", "assets/medhmar-logo.svg", "assets/medhmar-logo-full.svg", "assets/medhmar-logo-icon.svg", "assets/racing-hero.webp",
  "js/app.js", "js/api.js", "js/data.js", "js/routes.js", "js/race-routes.js", "js/race-extra-app.js"
];

for (const path of required) await access(path);

const routes = await readFile("js/routes.js", "utf8");
const raceRoutes = await readFile("js/race-routes.js", "utf8");
const requiredNames = [
  "Landing / Entry Page","Sign In","Create Account","Forgot Password","Reset Password",
  "Home / Overview","Settings / User Profile","Trainer Profile","Challenges",
  "Challenge Detail + Voting","Training Log","Admin Dashboard","Pedigree Directory","Pedigree Section","Edit Pedigree",
  "Race Card Publish Control","Organizations UI","Tourism / Cultural Content UI",
  "Race Card Public / History UI", "Training Agreements", "Training Agreement Details",
  "Audit Logs", "Audit Log Details"
];
for (const name of requiredNames) {
  if (!routes.includes(name)) throw new Error(`Missing Mohammed route: ${name}`);
}

const forbiddenStandalone = [
  'path: "/my-camels"',
  'path: "/assigned"'
];
for (const route of forbiddenStandalone) {
  if (routes.includes(route)) throw new Error(`Teammate-owned standalone route included: ${route}`);
}

for (const name of ["Camels","My Camels","Marketplace","My Listings","Listing History","My Offers","Offer Detail"]) {
  if (!routes.includes(name)) throw new Error(`Missing Camel & Marketplace route: ${name}`);
}

for (const name of [
  "Races Listing","Race Archive","Race Details","Race Participants","Race Results",
  "Race Registration","My Registrations","Organizer Race Dashboard","Add Race","Manage Race"
]) {
  if (!raceRoutes.includes(name)) throw new Error(`Missing race route: ${name}`);
}
await access("js/format.js");

console.log("Frontend scope check passed: assigned interfaces + Camel, Marketplace, TrainingAgreement and auditLog interfaces.");
