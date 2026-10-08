import { assistantApi } from "./api.js";

function assistantErrorMessage(error) {
  const status = Number(error?.status);
  if (status === 401 || status === 403) return "Your session has expired or access was denied. Please sign in again.";
  if (status === 429) return "Too many questions right now. Please wait a moment and try again.";
  if (status === 503) return "The AI assistant is not configured on this server yet.";
  if (status === 502) return "The AI service could not respond. Please try again later.";
  if (status === 400) return "Please check your question and try again.";
  if (status === 0) return "The backend is unreachable. Make sure Spring Boot is running.";
  return "Could not contact Medhmar Assistant. Please try again.";
}

function appendAssistantMessage(list, sender, message, error = false) {
  const row = document.createElement("div");
  row.className = `assistant-message assistant-message-${sender}${error ? " assistant-message-error" : ""}`;
  const avatar = document.createElement("span");
  avatar.className = "assistant-message-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = sender === "assistant" ? "✦" : "You";
  const bubble = document.createElement("div");
  bubble.className = "assistant-message-bubble";
  bubble.textContent = String(message);
  row.append(avatar, bubble);
  list.append(row);
  list.scrollTop = list.scrollHeight;
  return row;
}

export function renderAssistantView({ signedIn = false, preferredLanguage = "en" } = {}) {
  const lang = preferredLanguage === "ar" ? "ar" : "en";
  const status = signedIn ? "Checking availability…" : "Sign in required";
  return `
    <section class="medhmar-assistant" id="medhmar-assistant" data-signed-in="${signedIn ? "true" : "false"}"
      aria-labelledby="medhmar-assistant-title" lang="en" dir="ltr">
      <div class="assistant-heading">
        <span class="assistant-brand-icon" aria-hidden="true">✦</span>
        <div class="assistant-heading-copy">
          <h2 id="medhmar-assistant-title">Medhmar Assistant</h2>
          <p>Ask about racing, profiles and registration</p>
        </div>
        <span class="assistant-status" id="assistant-status" role="status">${status}</span>
      </div>
      <div class="assistant-body">
        <div class="assistant-messages" id="assistant-messages" role="log"
          aria-label="Conversation with Medhmar Assistant" aria-live="polite" aria-relevant="additions">
          <div class="assistant-message assistant-message-assistant">
            <span class="assistant-message-avatar" aria-hidden="true">✦</span>
            <div class="assistant-message-bubble">Hello! I'm the Medhmar Assistant. Ask me how to use the platform or learn about camel racing.</div>
          </div>
        </div>
        <div class="assistant-suggestions" aria-label="Suggested questions">
          <button type="button" class="assistant-suggestion" data-assistant-prompt="How do I register a camel for a race?">How do I register for a race?</button>
          <button type="button" class="assistant-suggestion" data-assistant-prompt="How can I view a camel's pedigree?">How do I view a pedigree?</button>
        </div>
        <form class="assistant-form" id="assistant-form">
          <label class="assistant-input-label" for="assistant-question">Ask a question</label>
          <div class="assistant-compose">
            <textarea id="assistant-question" name="question" placeholder="Ask something..." maxlength="2000"
              rows="2" required disabled aria-describedby="assistant-feedback"></textarea>
            <button class="assistant-send" id="assistant-send" type="submit" aria-label="Send message" disabled>
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m21 3-7.8 18-3.5-7.7L2 9.8 21 3Z"/><path d="M21 3 9.7 13.3"/></svg>
            </button>
          </div>
          <div class="assistant-form-footer">
            <label class="assistant-language-label" for="assistant-language">Language
              <select id="assistant-language" name="language" aria-label="Response language">
                <option value="en" ${lang === "en" ? "selected" : ""}>English</option>
                <option value="ar" ${lang === "ar" ? "selected" : ""}>العربية</option>
              </select>
            </label>
            <span>Responses may be inaccurate.</span>
          </div>
        </form>
        <p class="assistant-feedback" id="assistant-feedback" role="status">${status}</p>
        ${signedIn ? "" : '<a href="/signin" data-link class="assistant-signin">Sign in to use the assistant →</a>'}
      </div>
    </section>`;
}

export function bindAssistantView(root = document) {
  const panel = root.querySelector("#medhmar-assistant");
  if (!panel) return;
  const messages = panel.querySelector("#assistant-messages");
  const form = panel.querySelector("#assistant-form");
  const input = panel.querySelector("#assistant-question");
  const send = panel.querySelector("#assistant-send");
  const language = panel.querySelector("#assistant-language");
  const status = panel.querySelector("#assistant-status");
  const feedback = panel.querySelector("#assistant-feedback");
  let ready = false;
  let busy = false;
  let maxLength = 2000;

  function controls() {
    input.disabled = !ready || busy;
    send.disabled = !ready || busy || !input.value.trim();
    language.disabled = busy;
  }
  function report(message, type = "") {
    status.textContent = type === "ready" ? "Online" : type === "error" ? "Unavailable" : "Connecting";
    status.dataset.state = type;
    feedback.textContent = message;
    feedback.dataset.state = type;
  }
  if (panel.dataset.signedIn !== "true") {
    report("Sign in to ask questions.", "error");
    controls();
    return;
  }

  controls();
  assistantApi.status().then((result) => {
    if (!panel.isConnected) return;
    ready = result?.available === true;
    if (Number.isInteger(result?.maxQuestionLength) && result.maxQuestionLength > 0) {
      maxLength = Math.min(2000, result.maxQuestionLength);
      input.maxLength = maxLength;
    }
    report(ready
      ? "Connected. Questions are sent to the configured AI provider."
      : "AI is not enabled yet. Activate the Spring Boot ai profile and configure your provider.", ready ? "ready" : "error");
    controls();
  }).catch((error) => {
    if (!panel.isConnected) return;
    report(assistantErrorMessage(error), "error");
    controls();
  });

  panel.querySelectorAll("[data-assistant-prompt]").forEach(button => {
    button.addEventListener("click", () => {
      input.value = button.dataset.assistantPrompt.slice(0, maxLength);
      controls();
      if (!input.disabled) input.focus();
    });
  });

  input.addEventListener("input", controls);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      if (ready && !busy && input.value.trim()) form.requestSubmit();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!ready || busy || !question || question.length > maxLength) return;
    busy = true;
    controls();
    appendAssistantMessage(messages, "user", question);
    input.value = "";
    const typing = appendAssistantMessage(messages, "assistant", "Thinking…");
    try {
      const result = await assistantApi.chat({ question, language: language.value });
      if (!panel.isConnected) return;
      const answer = typeof result?.answer === "string" ? result.answer.trim() : "";
      if (!answer) throw new Error("EMPTY_ANSWER");
      typing.querySelector(".assistant-message-bubble").textContent = answer;
      report("Answered. You can ask another question.", "ready");
    } catch (error) {
      if (!panel.isConnected) return;
      typing.classList.add("assistant-message-error");
      typing.querySelector(".assistant-message-bubble").textContent = assistantErrorMessage(error);
      if ([401, 403, 503].includes(Number(error?.status))) ready = false;
      report(assistantErrorMessage(error), ready ? "ready" : "error");
    } finally {
      busy = false;
      if (panel.isConnected) {
        controls();
        messages.scrollTop = messages.scrollHeight;
      }
    }
  });
}

// Discoverable, site-wide launcher: only mounted once outside the router.

function renderAssistantLauncher() {
  return `
    <button type="button" class="assistant-dock-launcher" id="assistant-dock-launcher"
      aria-controls="assistant-dock-panel" aria-expanded="false"
      aria-label="Open Medhmar Assistant">
      <span class="assistant-dock-launcher-icon" aria-hidden="true">✦</span>
      <span class="assistant-dock-launcher-label">Ask Medhmar</span>
      <span class="assistant-dock-launcher-pulse" aria-hidden="true"></span>
    </button>
    <div class="assistant-dock-panel" id="assistant-dock-panel" hidden></div>
  `;
}

function syncAssistantDock({ user, preferredLanguage = "en", path = "/" } = {}) {
  if (typeof document === "undefined" || !document.body) return;

  // Keep the login and recovery forms distraction-free.
  const authPages = new Set(["/signin", "/signup", "/forgot-password", "/reset-password"]);
  let dock = document.getElementById("medhmar-assistant-dock");
  if (authPages.has(path)) {
    dock?.remove();
    return;
  }

  const accountId = user?.userId ? String(user.userId) : "guest";
  if (dock && dock.dataset.accountId !== accountId) {
    // Do not let one account see the previous account's local chat messages.
    dock.remove();
    dock = null;
  }

  // The dock stays in document.body, outside the router-managed #app tree.
  // This keeps an open conversation intact when navigating between pages.
  if (dock) return;
  dock = document.createElement("aside");
  dock.id = "medhmar-assistant-dock";
  dock.className = "medhmar-assistant-dock";
  dock.dataset.accountId = accountId;
  dock.setAttribute("aria-label", "Medhmar Assistant");
  dock.innerHTML = renderAssistantLauncher();
  document.body.append(dock);

  const launcher = dock.querySelector("#assistant-dock-launcher");
  const panel = dock.querySelector("#assistant-dock-panel");

  function close() {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-label", "Open Medhmar Assistant");
    launcher.focus();
  }

  launcher.addEventListener("click", () => {
    if (!panel.hidden) {
      close();
      return;
    }

    // Initialize chat only when requested: no unnecessary AI status calls.
    if (!panel.firstElementChild) {
      panel.innerHTML = renderAssistantView({
        signedIn: accountId !== "guest",
        preferredLanguage
      });
      const heading = panel.querySelector(".assistant-heading");
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "assistant-dock-close";
      closeButton.id = "assistant-dock-close";
      closeButton.setAttribute("aria-label", "Close Medhmar Assistant");
      closeButton.textContent = "×";
      heading.append(closeButton);
      closeButton.addEventListener("click", close);
      bindAssistantView(panel);
    }

    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    launcher.setAttribute("aria-label", "Close Medhmar Assistant");
    const availableInput = panel.querySelector("#assistant-question:not(:disabled)");
    (availableInput || panel.querySelector("#assistant-dock-close"))?.focus();
  });

  dock.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      event.preventDefault();
      close();
    }
  });
}
