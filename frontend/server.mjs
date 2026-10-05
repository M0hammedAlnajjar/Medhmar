import http from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.FRONTEND_PORT || 5500);
const host = process.env.FRONTEND_HOST || "127.0.0.1";
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".ico": "image/x-icon",
};
const server = http.createServer(async (req, res) => {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end();
    return;
  }
  try {
    const path = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const relative = path === "/" ? "index.html" : path.slice(1);
    if (
      !["index.html", "reset-password.html"].includes(relative) &&
      !relative.startsWith("assets/") &&
      !relative.startsWith("js/")
    ) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const file = resolve(root, relative);
    if (
      !file.startsWith(root + sep) ||
      relative.split("/").some((part) => part.startsWith("."))
    ) {
      res.writeHead(403);
      res.end();
      return;
    }
    const data = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cache-Control": "no-cache",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' http: https:; connect-src 'self' http://localhost:8080 http://127.0.0.1:8080 https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
    });
    res.end(req.method === "HEAD" ? undefined : data);
  } catch (error) {
    res.writeHead(error.code === "ENOENT" ? 404 : 400);
    res.end("Not found");
  }
});
server.listen(port, host, () =>
  console.log(`Gulf Racing frontend: http://${host}:${port}`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => process.exit(0)));
