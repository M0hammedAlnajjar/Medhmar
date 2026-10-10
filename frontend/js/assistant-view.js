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

// Real branded artwork is served from the project's official Medhmar logo assets.
// Functional UI symbols have a consistent 20px stroke-based icon treatment.
const assistantIconPaths = {
  trophy: '<path d="M8 3h8v6a4 4 0 0 1-8 0V3Z"/><path d="M8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 13v6m-4 2h8"/>',
  camel: '<path d="M2 19h3l1-5 2-3 2 1 2-2 2 2 1-1 2 2 1-4 2-2 2 1v3l-2 1-1 7h-3l-.5-4-2.5-1-2 5H9l-1-4-2 1-.5 3H2Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-14 4h3m4 0h3"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2m2-16a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5"/>',
  send: '<path d="m21 3-8 18-3-8-8-3L21 3Z"/><path d="m21 3-11 10"/>',
  paperclip: '<path d="m21 11-8.8 8.8a6 6 0 0 1-8.4-8.4L13.4 2a4 4 0 0 1 5.7 5.7l-9.3 9.3a2 2 0 0 1-2.8-2.8l8.8-8.8"/>',
  mic: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  minus: '<path d="M5 12h14"/>'
};
function assistantIcon(name, size = 20) {
  return '<svg class="assistant-icon" width="' + size + '" height="' + size
    + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"'
    + ' stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true">'
    + (assistantIconPaths[name] || assistantIconPaths.info) + '</svg>';
}
const assistantCamelLogo = '<img src="/assets/assistant-camel-mark.svg?v=crescent-20261010" alt="" aria-hidden="true" width="48" height="48" />';
const assistantFullLogo = '<img src="/assets/medhmar-logo-full.svg" alt="MEDHMAR — Oman Camel Racing" loading="lazy" />';
function assistantTimestamp() {
  return new Intl.DateTimeFormat(undefined, {hour:'numeric',minute:'2-digit'}).format(new Date());
}
function appendAssistantMessage(list, sender, message, error = false) {
  list.querySelectorAll('.assistant-example-label, .assistant-sample-message').forEach(el => el.remove());
  const row = document.createElement('div');
  row.className = 'assistant-message assistant-message-' + sender + (error ? ' assistant-message-error' : '');
  const avatar = document.createElement('span');
  avatar.className = 'assistant-message-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.innerHTML = sender === 'assistant' ? assistantCamelLogo : assistantIcon('user',19);
  const content = document.createElement('div');
  content.className = 'assistant-message-content';
  const bubble = document.createElement('div');
  bubble.className = 'assistant-message-bubble';
  bubble.textContent = String(message);
  const time = document.createElement('time');
  time.className = 'assistant-message-time';
  time.textContent = assistantTimestamp();
  content.append(bubble, time);
  row.append(avatar,content);
  list.append(row);
  list.scrollTop = list.scrollHeight;
  return row;
}

export function renderAssistantView({ signedIn = false, preferredLanguage = 'en' } = {}) {
  const lang = preferredLanguage === 'ar' ? 'ar' : 'en';
  const status = signedIn ? 'Connecting' : 'Sign in';
  return '<section class="medhmar-assistant" id="medhmar-assistant" data-signed-in="' + (signedIn ? 'true' : 'false') + '"'
    + ' aria-labelledby="medhmar-assistant-title" lang="en" dir="ltr">'
    + '<div class="assistant-heading">'
    + '<span class="assistant-brand-icon">' + assistantFullLogo + '</span>'
    + '<div class="assistant-heading-copy"><h2 id="medhmar-assistant-title">Medhmar Assistant</h2>'
    + '<p>Your guide to Oman&#39;s camel racing platform</p></div>'
    + '<span class="assistant-status" id="assistant-status" role="status">' + status + '</span></div>'
    + '<div class="assistant-body">'
    + '<div class="assistant-messages" id="assistant-messages" role="log" aria-label="Conversation with Medhmar Assistant" aria-live="polite" aria-relevant="additions">'
    + '<div class="assistant-message assistant-message-assistant">'
    + '<span class="assistant-message-avatar" aria-hidden="true">' + assistantCamelLogo + '</span>'
    + '<div class="assistant-message-content"><div class="assistant-message-bubble">'
    + 'Hello! I&#39;m the Medhmar Assistant. Ask me about races, camels, pedigrees, registration or anything about the platform.'
    + '</div><time class="assistant-message-time">' + assistantTimestamp() + '</time></div></div>'
    + '<div class="assistant-example-label">Example conversation'
    + '<button class="assistant-example-toggle" id="assistant-example-toggle" type="button" aria-expanded="false" aria-controls="assistant-messages">View example <span aria-hidden="true">⌄</span></button></div>'
    + '<div class="assistant-message assistant-message-user assistant-sample-message" aria-label="Example question">'
    + '<span class="assistant-message-avatar" aria-hidden="true">' + assistantIcon('user',19) + '</span>'
    + '<div class="assistant-message-content"><div class="assistant-message-bubble">How do I register for a race?</div></div></div>'
    + '<div class="assistant-message assistant-message-assistant assistant-sample-message" aria-label="Example answer">'
    + '<span class="assistant-message-avatar" aria-hidden="true">' + assistantCamelLogo + '</span>'
    + '<div class="assistant-message-content"><div class="assistant-message-bubble">'
    + 'To register for a race, open the Races section, choose an upcoming race and follow the registration steps.'
    + '</div></div></div></div>'
    + '<form class="assistant-form" id="assistant-form">'
    + '<label class="assistant-input-label" for="assistant-question">Ask Medhmar something</label>'
    + '<div class="assistant-compose">'
    + '<button type="button" class="assistant-attach" id="assistant-attach" aria-label="Insert text from a file" title="Insert text from a .txt or .md file" disabled>' + assistantIcon('paperclip',19) + '</button>'
    + '<input type="file" id="assistant-file" accept=".txt,.md,text/plain,text/markdown" hidden aria-label="Choose text file">'
    + '<textarea id="assistant-question" name="question" placeholder="Ask Medhmar something..." maxlength="2000" rows="1" required disabled aria-describedby="assistant-feedback"></textarea>'
    + '<button type="button" class="assistant-mic" id="assistant-mic" aria-label="Dictate a question" title="Dictate a question" disabled>' + assistantIcon('mic',21) + '</button>'
    + '<button type="submit" class="assistant-send" id="assistant-send" aria-label="Send message" disabled>' + assistantIcon('send',21) + '</button>'
    + '</div><div class="assistant-form-footer">'
    + '<label class="assistant-language-label" for="assistant-language">' + assistantIcon('globe',19) + ' Language'
    + '<select id="assistant-language" name="language" aria-label="Response language">'
    + '<option value="en"' + (lang === 'en' ? ' selected' : '') + '>English</option>'
    + '<option value="ar"' + (lang === 'ar' ? ' selected' : '') + '>العربية</option>'
    + '</select></label>'
    + '<span class="assistant-disclaimer">' + assistantIcon('info',16) + ' Responses may be inaccurate. Verify important information.</span>'
    + '</div></form>'
    + '<p class="assistant-feedback" id="assistant-feedback" role="status">' + status + '</p>'
    + (signedIn ? '' : '<div class="assistant-signin-row"><span>' + assistantIcon('user',20) + ' Sign in to use the assistant</span>'
      + '<a href="/signin" data-link class="assistant-signin">Sign In ' + assistantIcon('arrow',16) + '</a></div>')
    + '</div></section>';
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
  const exampleToggle = panel.querySelector("#assistant-example-toggle");
  exampleToggle?.addEventListener("click", () => {
    const expanded = messages.dataset.previewOpen !== "true";
    messages.dataset.previewOpen = String(expanded);
    exampleToggle.setAttribute("aria-expanded", String(expanded));
    exampleToggle.innerHTML = (expanded ? "Hide example" : "View example") + ' <span aria-hidden="true">' + (expanded ? "⌃" : "⌄") + "</span>";
    if (expanded) {
      const sample = messages.querySelector(".assistant-sample-message");
      sample?.scrollIntoView({block:"nearest",behavior:"auto"});
    }
  });

  const attach = panel.querySelector("#assistant-attach");
  const fileInput = panel.querySelector("#assistant-file");
  const mic = panel.querySelector("#assistant-mic");
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let ready = false;
  let busy = false;
  let listening = false;
  let maxLength = 2000;

  function controls() {
    input.disabled = !ready || busy || listening;
    send.disabled = !ready || busy || listening || !input.value.trim();
    attach.disabled = !ready || busy || listening;
    mic.disabled = !ready || busy || listening || !SpeechRecognition;
    mic.title = SpeechRecognition ? "Dictate a question" : "Voice input is not supported in this browser";
    language.disabled = busy || listening;
  }
  function report(message, type = "") {
    status.textContent = type === "ready" ? "Online" : type === "signin" ? "Sign in" : type === "error" ? "Unavailable" : "Connecting";
    status.dataset.state = type;
    feedback.textContent = message;
    feedback.dataset.state = type;
  }
  if (panel.dataset.signedIn !== "true") {
    report("Sign in to ask questions.", "signin");
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

  // Attach text as question content. The API accepts text only: no fake file upload.
  attach.addEventListener('click', () => {
    if (!attach.disabled) fileInput.click();
  });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file || !ready || busy) return;
    if (!/\.(txt|md)$/i.test(file.name) || file.size > 64 * 1024) {
      feedback.textContent = 'Choose a .txt or .md file smaller than 64 KB.';
      return;
    }
    try {
      const text = (await file.text()).trim();
      if (!text || !panel.isConnected) return;
      const next = [input.value.trim(),text].filter(Boolean).join('\n\n');
      input.value = next.slice(0, maxLength);
      feedback.textContent = next.length > maxLength
        ? 'Text was shortened to fit the question limit.'
        : 'Text inserted. Review it before sending.';
      controls();
      input.focus();
    } catch {
      feedback.textContent = 'Could not read that text file.';
    }
  });

  // Browser-native speech-to-text, when supported. No audio reaches our chat API.
  if (SpeechRecognition) {
    mic.addEventListener('click', () => {
      if (mic.disabled) return;
      const recognition = new SpeechRecognition();
      recognition.lang = language.value === 'ar' ? 'ar-OM' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const said = Array.from(event.results)
          .map(r=>r[0]?.transcript || '').join(' ').trim();
        input.value = [input.value.trim(),said].filter(Boolean).join(' ').slice(0,maxLength);
        feedback.textContent = 'Dictation captured. Review your question before sending.';
      };
      recognition.onerror = () => {
        feedback.textContent = 'Voice recognition could not complete. Try typing instead.';
      };
      recognition.onend = () => {
        listening = false;
        mic.classList.remove('assistant-mic-active');
        controls();
        if (!input.disabled) input.focus();
      };
      try {
        listening = true;
        mic.classList.add('assistant-mic-active');
        controls();
        recognition.start();
        feedback.textContent = 'Listening…';
      } catch {
        listening = false;
        mic.classList.remove('assistant-mic-active');
        controls();
        feedback.textContent = 'Voice input is unavailable. Try typing instead.';
      }
    });
  }

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

export function renderAssistantLauncher() {
  return `
    <button type="button" class="assistant-dock-launcher" id="assistant-dock-launcher"
      aria-controls="assistant-dock-panel" aria-expanded="false"
      aria-label="Open Medhmar Assistant">
      <span class="assistant-dock-launcher-icon" aria-hidden="true">${assistantCamelLogo}</span>
      <span class="assistant-dock-launcher-label">Ask Medhmar</span>
      <span class="assistant-dock-launcher-pulse" aria-hidden="true"></span>
    </button>
    <div class="assistant-dock-panel" id="assistant-dock-panel" hidden></div>
  `;
}

export function syncAssistantDock({ user, preferredLanguage = "en", path = "/" } = {}) {
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
      const minimizeButton = document.createElement("button");
      minimizeButton.type = "button";
      minimizeButton.className = "assistant-dock-minimize";
      minimizeButton.setAttribute("aria-label", "Minimize Medhmar Assistant");
      minimizeButton.title = "Minimize chat";
      minimizeButton.innerHTML = assistantIcon('minus', 20);
      minimizeButton.addEventListener("click", close);
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "assistant-dock-close";
      closeButton.id = "assistant-dock-close";
      closeButton.setAttribute("aria-label", "Close Medhmar Assistant");
      closeButton.textContent = "×";
      heading.append(minimizeButton, closeButton);
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
