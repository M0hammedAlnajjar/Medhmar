import { access, readFile } from "node:fs/promises";

const required = [
  "index.html", "server.mjs", "package.json",
  "assets/styles.css", "assets/mark.svg", "assets/racing-hero.webp",
  "js/app.js", "js/api.js", "js/data.js", "js/routes.js"
];

for (const path of required) await access(path);

const routes = await readFile("js/routes.js", "utf8");
const requiredNames = [
  "Landing / Entry Page","Sign In","Create Account","Forgot Password","Reset Password",
  "Home / Overview","Settings / User Profile","Trainer Profile","Challenges",
  "Challenge Detail + Voting","Training Log","Admin Dashboard","Pedigree Section",
  "Race Card Publish Control","Organizations UI","Tourism / Cultural Content UI",
  "Race Card Public / History UI"
];
for (const name of requiredNames) {
  if (!routes.includes(name)) throw new Error(`Missing Mohammed route: ${name}`);
}

const forbiddenStandalone = [
  'path: "/races"', 'path: "/archive"', 'path: "/my-camels"',
  'path: "/agreements"', 'path: "/assigned"'
];
for (const route of forbiddenStandalone) {
  if (routes.includes(route)) throw new Error(`Teammate-owned standalone route included: ${route}`);
}

for (const name of ["Camels","My Camels","Marketplace","My Listings","Listing History","My Offers","Offer Detail"]) {
  if (!routes.includes(name)) throw new Error(`Missing Camel & Marketplace route: ${name}`);
}
await access("js/format.js");

console.log("Frontend scope check passed: Mohammed interfaces + Camel & Marketplace interfaces.");
