import test from "node:test";
import assert from "node:assert/strict";
import { createApi, ApiError, query } from "../js/api.js";
import { esc, safeImage } from "../js/ui.js";
import { currentRoute, safeNext } from "../js/router.js";
const response = (data, status = 200) =>
  new Response(status === 204 ? null : JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

test("mutations obtain CSRF and always include cookies without persisting credentials", async () => {
  const calls = [];
  const client = createApi({
    base: "https://api.example.test",
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return response(
        url.endsWith("/csrf")
          ? { headerName: "X-CSRF-TOKEN", token: "first" }
          : { ok: true },
      );
    },
  });
  await client.send("/api/auth/login", "POST", {
    email: "owner@example.test",
    password: "not-a-real-password",
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[1].options.headers["X-CSRF-TOKEN"], "first");
  assert.ok(calls.every((c) => c.options.credentials === "include"));
  assert.equal(JSON.parse(calls[1].options.body).email, "owner@example.test");
});
test("CSRF rotates explicitly after login and is reused only until cleared", async () => {
  let issued = 0;
  const tokens = [];
  const client = createApi({
    fetcher: async (url, o) =>
      url.endsWith("/csrf")
        ? response({ headerName: "X-CSRF-TOKEN", token: `csrf-${++issued}` })
        : (tokens.push(o.headers["X-CSRF-TOKEN"]), response({})),
  });
  await client.send("/api/auth/login");
  client.clearCsrf();
  await client.refreshCsrf();
  await client.send("/camel/add");
  assert.deepEqual(tokens, ["csrf-1", "csrf-2"]);
});
test("a forbidden mutation is never replayed automatically", async () => {
  let writes = 0;
  const client = createApi({
    fetcher: async (url) =>
      url.endsWith("/csrf")
        ? response({ headerName: "X-CSRF-TOKEN", token: "csrf" })
        : (writes++, response({ message: "Forbidden" }, 403)),
  });
  await assert.rejects(
    client.send("/offer/1/accept"),
    (error) => error.status === 403,
  );
  assert.equal(writes, 1);
});
test("server validation fields survive for accessible inline feedback", async () => {
  const client = createApi({
    fetcher: async () =>
      response(
        { message: "Invalid input", errors: { name: "Name is required" } },
        400,
      ),
  });
  await assert.rejects(
    client.get("/camel/getAll"),
    (error) =>
      error instanceof ApiError && error.fields.name === "Name is required",
  );
});
test("204 logout succeeds and non-JSON responses fail clearly", async () => {
  const client = createApi({
    fetcher: async (url) =>
      url.endsWith("/csrf")
        ? response({ headerName: "X-CSRF-TOKEN", token: "csrf" })
        : response(null, 204),
  });
  assert.equal(await client.send("/api/auth/logout"), null);
  const bad = createApi({
    fetcher: async () =>
      new Response("<html>Proxy error</html>", { status: 200 }),
  });
  await assert.rejects(bad.get("/api/users/me"), /unexpected response/);
});
test("navigation cancellation is distinct from a service timeout", async () => {
  const fetcher = (_, o) =>
    new Promise((resolve, reject) => {
      if (o.signal.aborted) reject(o.signal.reason);
      else o.signal.addEventListener("abort", () => reject(o.signal.reason));
    });
  const timed = createApi({ fetcher, timeout: 5 });
  await assert.rejects(timed.get("/api/races"), /took too long/);
  const controller = new AbortController(),
    client = createApi({ fetcher });
  const result = client.get("/api/races", controller.signal);
  controller.abort();
  await assert.rejects(result, (error) => error.name === "AbortError");
});
test("API query values are encoded and absolute request paths are rejected", async () => {
  assert.equal(
    query({ search: "Muscat & Barka", page: 0, empty: "", none: null }),
    "?search=Muscat+%26+Barka&page=0",
  );
  await assert.rejects(
    createApi().get("//attacker.example/path"),
    /Invalid API path/,
  );
});
test("untrusted content and image URLs cannot become executable HTML", () => {
  assert.equal(
    esc('<img src=x onerror="alert(1)">'),
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
  );
  assert.equal(safeImage("javascript:alert(1)"), "");
  assert.equal(safeImage("data:image/svg+xml,<svg/>"), "");
  assert.equal(
    safeImage("https://example.test/camel.png"),
    "https://example.test/camel.png",
  );
});
test("hash routing is reload-safe and sign-in return paths stay inside the app", () => {
  const route = currentRoute("#/races/12/participants?lang=ar");
  assert.equal(route.path, "/races/12/participants");
  assert.equal(route.params.get("lang"), "ar");
  assert.equal(safeNext("https://attacker.example"), "/home");
  assert.equal(safeNext("//attacker.example"), "/home");
  assert.equal(safeNext("/offers/4"), "/offers/4");
});
