import test from "node:test";
import assert from "node:assert/strict";

// The API module reads the location at import time, as it does in the browser.
globalThis.window = { location: { hostname: "localhost" } };
const { renderAssistantView, renderAssistantLauncher, syncAssistantDock } = await import("../js/assistant-view.js");
const { assistantApi } = await import("../js/api.js");

test("Assistant chat can render before AI is configured", () => {
  const html = renderAssistantView({ signedIn: true, preferredLanguage: "en" });
  assert.match(html, /Medhmar Assistant/);
  assert.match(html, /id="assistant-form"/);
  assert.match(html, /id="assistant-question"/);
  assert.match(html, /Checking availability/);
  assert.match(html, /maxlength="2000"/);
  assert.doesNotMatch(html, /api.key|sk-[a-z0-9]/i);
});

test("Guest chat stays disabled and offers a sign-in link", () => {
  const html = renderAssistantView({ signedIn: false });
  assert.match(html, /data-signed-in="false"/);
  assert.match(html, /Sign in to use the assistant/);
  assert.match(html, /id="assistant-question"[^>]*disabled/);
});

test("Assistant language selector supports Arabic and English", () => {
  const html = renderAssistantView({ signedIn: true, preferredLanguage: "ar" });
  assert.match(html, /<option value="ar" selected>/);
  assert.match(html, /<option value="en" >English/);
});

test("Assistant API sends credentials and a fresh CSRF token with each question", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    if (url.endsWith("/api/ai/status")) {
      return new Response(JSON.stringify({ available: true, languages: ["ar", "en"], maxQuestionLength: 2000 }),
        { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.endsWith("/api/auth/csrf")) {
      return new Response(JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "fresh-csrf" }),
        { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.endsWith("/api/ai/chat")) {
      return new Response(JSON.stringify({ answer: "You can browse the races page.", language: "en", sources: [] }),
        { status: 200, headers: { "content-type": "application/json" } });
    }
    throw new Error("Unexpected URL: " + url);
  };
  try {
    const status = await assistantApi.status();
    assert.equal(status.available, true);
    const reply = await assistantApi.chat({ question: "How do I see races?", language: "en" });
    assert.match(reply.answer, /browse the races/);
    assert.equal(calls.length, 3);
    assert.equal(calls[0].options.credentials, "include");
    const sent = calls[2];
    assert.equal(sent.options.method, "POST");
    assert.equal(sent.options.credentials, "include");
    assert.equal(sent.options.headers.get("X-XSRF-TOKEN"), "fresh-csrf");
    assert.deepEqual(JSON.parse(sent.options.body), { question: "How do I see races?", language: "en" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Disabled AI status is surfaced, not replaced by mock answers", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(
    JSON.stringify({ available: false, languages: ["ar", "en"], maxQuestionLength: 2000 }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
  try {
    assert.equal((await assistantApi.status()).available, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test("site-wide launcher offers discoverable chat access and an accessible toggle", () => {
  const html = renderAssistantLauncher();
  assert.match(html, /Ask Medhmar/);
  assert.match(html, /id="assistant-dock-launcher"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-controls="assistant-dock-panel"/);
  assert.match(html, /id="assistant-dock-panel" hidden/);
});

test("dock is created once and does not lose its conversation across route changes", () => {
  const originalDocument = globalThis.document;
  let current = null;
  const launcher = {
    addEventListener() {}, setAttribute() {}, focus() {}
  };
  const panel = {
    hidden: true, firstElementChild: null
  };
  const fakeDocument = {
    body: { append(node) { current = node; } },
    getElementById(id) { return id === "medhmar-assistant-dock" ? current : null; },
    createElement(tag) {
      assert.equal(tag, "aside");
      return {
        dataset: {},
        setAttribute() {}, addEventListener() {},
        querySelector(selector) {
          if (selector === "#assistant-dock-launcher") return launcher;
          if (selector === "#assistant-dock-panel") return panel;
          return null;
        },
        remove() { current = null; }
      };
    }
  };
  globalThis.document = fakeDocument;
  try {
    const account = { userId: 42 };
    syncAssistantDock({ user: account, path: "/home" });
    assert.equal(current?.id, "medhmar-assistant-dock");
    assert.match(current?.innerHTML, /Ask Medhmar/);
    const firstInstance = current;
    syncAssistantDock({ user: account, path: "/races" });
    assert.equal(current, firstInstance, "navigation should not rebuild chat");
    syncAssistantDock({ user: account, path: "/settings" });
    assert.equal(current, firstInstance, "Settings should not contain a second copy");
    syncAssistantDock({ user: { userId: 99 }, path: "/home" });
    assert.notEqual(current, firstInstance, "switching accounts must discard old chat");
    assert.equal(current.dataset.accountId, "99");
    syncAssistantDock({ user: { userId: 99 }, path: "/signin" });
    assert.equal(current, null, "auth pages must not display the dock");
  } finally {
    globalThis.document = originalDocument;
  }
});

test("Profile & Settings no longer embeds the chat in its main layout", async () => {
  const { readFile } = await import("node:fs/promises");
  const script = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
  const settings = script.split("function settings()")[1].split("function trainer()")[0];
  assert.match(settings, /settings-account-layout/);
  assert.doesNotMatch(settings, /renderAssistantView|medhmar-assistant/);
  assert.match(script, /syncAssistantDock\(\{ user: state\.user/);
});
