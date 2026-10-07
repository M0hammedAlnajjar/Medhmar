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
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function send(res, status, data = "", headers = {}) {
  res.writeHead(status, {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cache-Control": "no-cache",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: http: https:; connect-src 'self' http://localhost:8080 http://127.0.0.1:8080 https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
    ...headers
  });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  if (!["GET", "HEAD"].includes(req.method)) return send(res, 405, "", { Allow: "GET, HEAD" });

  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (pathname.split("/").some((part) => part === ".." || part.startsWith("."))) return send(res, 403);

    let relative;
    if (pathname.startsWith("/assets/") || pathname.startsWith("/js/")) relative = pathname.slice(1);
    else relative = "index.html";

    const file = resolve(root, relative);
    if (!file.startsWith(root + sep)) return send(res, 403);
    const data = await readFile(file);
    send(res, 200, req.method === "HEAD" ? "" : data, {
      "Content-Type": types[extname(file)] || "application/octet-stream"
    });
  } catch (error) {
    send(res, error.code === "ENOENT" ? 404 : 400, "Not found");
  }
});

server.listen(port, host, () => console.log(`Medhmar frontend: http://${host}:${port}`));
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

