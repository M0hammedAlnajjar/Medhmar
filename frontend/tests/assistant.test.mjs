import test from "node:test";
import assert from "node:assert/strict";

// The API module reads the location at import time, as it does in the browser.
globalThis.window = { location: { hostname: "localhost" } };
const { renderAssistantView } = await import("../js/assistant-view.js");
const { assistantApi } = await import("../js/api.js");

test("Profile & Settings shows the assistant even before AI is configured", () => {
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
