import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
async function scan(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await scan(path);
    else if (/\.(js|mjs)$/.test(path)) {
      const result = spawnSync(process.execPath, ["--check", path], {
        stdio: "inherit",
      });
      if (result.status) process.exit(result.status);
    }
  }
}
await scan("js");
await scan("scripts");
for (const path of ["index.html", "reset-password.html"]) {
  const html = await readFile(path, "utf8");
  for (const match of html.matchAll(/(?:src|href)="((?:js|assets)\/[^\"]+)"/g))
    await readFile(match[1]);
}
console.log("JavaScript syntax and entry-page assets checked.");
