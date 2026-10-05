import { api } from "./api.js";
import { state, t, can, setLanguage } from "./state.js";
import { currentRoute, navigate } from "./router.js";
import {
  brand,
  icon,
  esc,
  link,
  action,
  empty,
  errorPanel,
  toast,
  values,
  showFormError,
  safeImage,
} from "./ui.js";
import { authView } from "./views/auth.js";
import {
  landing,
  races,
  raceDetail,
  participants,
  raceResults,
  registration,
  registrations,
} from "./views/races.js";
import { camels, camelProfile, camelForm, ownership } from "./views/camels.js";
import { home, settings, trainerProfile } from "./views/account.js";
import {
  trainers,
  agreementForm,
  agreements,
  assigned,
  training,
} from "./views/training.js";
import {
  marketplace,
  listingDetail,
  listingForm,
  offers,
  offerDetail,
} from "./views/marketplace.js";
import { organizer, raceForm, admin } from "./views/manage.js";
import { challenges, challenge, assistant } from "./views/community.js";

const routeMap = [
  [/^\/$/, landing],
  [/^\/(signin|signup|forgot-password|reset-password)$/, authView],
  [/^\/home$/, home, []],
  [/^\/(races|archive)$/, races],
  [/^\/races\/(\d+)$/, raceDetail],
  [/^\/races\/(\d+)\/participants$/, participants],
  [/^\/races\/(\d+)\/results$/, raceResults],
  [/^\/races\/(\d+)\/register$/, registration, ["OWNER", "ADMIN"]],
  [/^\/registrations$/, registrations, []],
  [/^\/camels$/, camels],
  [/^\/my-camels$/, camels, []],
  [/^\/camels\/new$/, camelForm, ["OWNER", "ADMIN"]],
  [/^\/camels\/(\d+)\/edit$/, camelForm, ["OWNER", "ADMIN"]],
  [/^\/camels\/(\d+)$/, camelProfile],
  [/^\/camels\/(\d+)\/ownership$/, ownership],
  [/^\/settings$/, settings, []],
  [/^\/trainers$/, trainers],
  [/^\/trainer-profile$/, trainerProfile, ["TRAINER"]],
  [/^\/agreements$/, agreements, []],
  [/^\/agreements\/new$/, agreementForm, ["OWNER", "ADMIN"]],
  [/^\/assigned$/, assigned, ["TRAINER"]],
  [/^\/training$/, training, []],
  [/^\/marketplace$/, marketplace],
  [/^\/my-listings$/, marketplace, ["OWNER", "ADMIN"]],
  [/^\/marketplace\/new$/, listingForm, ["OWNER", "ADMIN"]],
  [/^\/marketplace\/(\d+)\/edit$/, listingForm, ["OWNER", "ADMIN"]],
  [/^\/marketplace\/(\d+)$/, listingDetail],
  [/^\/offers$/, offers, []],
  [/^\/offers\/(\d+)$/, offerDetail, []],
  [/^\/organizer$/, organizer, ["ORGANIZER", "ADMIN"]],
  [/^\/organizer\/races\/new$/, raceForm, ["ORGANIZER", "ADMIN"]],
  [/^\/organizer\/races\/(\d+)$/, raceForm, ["ORGANIZER", "ADMIN"]],
  [/^\/admin$/, admin, ["ADMIN"]],
  [/^\/assistant$/, assistant, []],
  [/^\/challenges$/, challenges],
  [/^\/challenges\/(\d+)$/, challenge],
];
let activeContext,
  controller,
  renderVersion = 0,
  dirty = false,
  mutationActive = false;
const main = document.querySelector("#main");
// Reset tokens arrive only in the URL fragment; remove them before any network request.
if (
  location.pathname.endsWith("reset-password.html") &&
  location.hash.startsWith("#token=")
) {
  state.resetToken = new URLSearchParams(location.hash.slice(1)).get("token");
  history.replaceState(null, "", `${location.pathname}#/reset-password`);
} else if (
  location.pathname.endsWith("reset-password.html") &&
  !location.hash.startsWith("#/")
) {
  history.replaceState(null, "", `${location.pathname}#/reset-password`);
}
setLanguage(state.language);
const restoreSession = api
  .request("/api/users/me", { quiet: true })
  .then((user) => {
    state.user = user;
  })
  .catch((error) => {
    // A missing session is normal; unavailable services are reported by the requested page.
    if (error.status !== 401) state.sessionUnavailable = true;
  });
function navLink(title, path, route) {
  return `<a href="#${path}" ${route.path === path || (path !== "/" && route.path.startsWith(path + "/")) ? 'aria-current="page"' : ""}>${title}</a>`;
}
function renderChrome(route) {
  const links = [
    [t("Home", "الرئيسية"), state.user ? "/home" : "/"],
    [t("Races", "السباقات"), "/races"],
    [t("Camels", "الهجن"), "/camels"],
    [t("Mudammers", "المضمّرون"), "/trainers"],
    [t("Marketplace", "السوق"), "/marketplace"],
  ];
  document.querySelector("#header").innerHTML =
    `<div class="header"><div class="container header-inner">${brand()}<nav id="main-nav" class="main-nav" aria-label="${t("Main navigation", "القائمة الرئيسية")}">${links.map(([label, path]) => navLink(label, path, route)).join("")}</nav><div class="header-actions"><button class="language-switch" data-action="language" lang="${state.language === "ar" ? "en" : "ar"}">${state.language === "ar" ? "English" : "العربية"}</button>${state.user ? `<a class="user-link" href="#/settings" aria-label="${t("Account settings", "إعدادات الحساب")}"><span class="avatar">${safeImage(state.user.avatarUrl) ? `<img src="${safeImage(state.user.avatarUrl)}" alt="" referrerpolicy="no-referrer">` : esc(state.user.fullName?.[0] || "U")}</span></a>` : link(t("Sign In", "تسجيل الدخول"), "#/signin", "button small")}<button class="menu-toggle" data-action="menu" aria-expanded="false" aria-controls="main-nav" aria-label="${t("Menu", "القائمة")}">${icon("menu")}</button></div></div></div>${state.user ? `<nav class="subnav" aria-label="${t("Your workspace", "مساحة عملك")}"><div class="container">${navLink(t("Overview", "نظرة عامة"), "/home", route)}${navLink(t("My camels", "هجنِي"), "/my-camels", route)}${navLink(t("Registrations", "التسجيلات"), "/registrations", route)}${can("OWNER", "TRAINER", "ADMIN") ? navLink(t("Agreements", "الاتفاقيات"), "/agreements", route) : ""}${can("TRAINER") ? navLink(t("Assigned camels", "الهجن المسندة"), "/assigned", route) : ""}${can("OWNER", "TRAINER", "ADMIN") ? navLink(t("Training log", "سجل التدريب"), "/training", route) : ""}${navLink(t("Offers", "العروض"), "/offers", route)}${navLink(t("Challenges", "التحديات"), "/challenges", route)}${navLink(t("Assistant", "المساعد"), "/assistant", route)}${can("ORGANIZER", "ADMIN") ? navLink(t("Organizer", "المنظّم"), "/organizer", route) : ""}${can("ADMIN") ? navLink(t("Admin", "الإدارة"), "/admin", route) : ""}</div></nav>` : ""}`;
  document.querySelector("#footer").innerHTML =
    `<div class="footer"><div class="container footer-inner">${brand()}<p>${t("A heritage carried forward. A community brought together.", "إرثٌ نواصل حمله. ومجتمعٌ يجمعنا.")}</p><div class="footer-links"><a href="#/archive">${t("Race Archive", "أرشيف السباقات")}</a><a href="#/challenges">${t("Challenges", "التحديات")}</a></div></div></div>`;
  document.querySelector(".skip-link").textContent = t(
    "Skip to content",
    "تخطَّ إلى المحتوى",
  );
}
export async function render() {
  const version = ++renderVersion;
  controller?.abort();
  controller = new AbortController();
  const route = currentRoute(),
    found = routeMap.find(([pattern]) => pattern.test(route.path));
  renderChrome(route);
  dirty = false;
  activeContext = null;
  main.setAttribute("aria-busy", "true");
  main.innerHTML = `<div class="container page" role="status" aria-label="${t("Loading", "جارٍ التحميل")}"><div class="skeleton loading-title"></div><div class="skeleton"></div></div>`;
  const ctx = {
    route,
    signal: controller.signal,
    forms: {},
    actions: {},
    get: (path) => api.get(path, controller.signal),
    reload: render,
  };
  // Capture this render's controller, not a future navigation's signal.
  ctx.get = (path) => api.get(path, ctx.signal);
  try {
    if (!found) {
      main.innerHTML = `<div class="container page screen-error"><h1>404</h1>${empty(t("Page not found", "الصفحة غير موجودة"), t("This page may have moved.", "قد يكون عنوان الصفحة تغيّر."), link(t("Go Home", "الصفحة الرئيسية"), "#/"))}</div>`;
      return;
    }
    const [pattern, view, roles] = found,
      match = route.path.match(pattern);
    if (match[1] && /^\d+$/.test(match[1])) {
      ctx.id = Number(match[1]);
      if (!Number.isSafeInteger(ctx.id) || ctx.id < 1)
        throw new Error(t("Invalid record ID.", "رقم السجل غير صالح."));
    }
    if (roles !== undefined) {
      await restoreSession;
      if (version !== renderVersion) return;
      if (!state.user) {
        navigate(
          `/signin?next=${encodeURIComponent(route.path + (route.params.size ? "?" + route.params : ""))}`,
        );
        return;
      }
      if (roles.length && !can(...roles)) {
        main.innerHTML = `<div class="container page screen-error">${icon("lock")}<h1>${t("Access restricted", "صلاحية مطلوبة")}</h1><p class="muted">${t("Your account does not have the role required for this page.", "حسابك لا يملك الدور المطلوب لهذه الصفحة.")}</p><div class="section">${link(t("Back to Home", "العودة للرئيسية"), "#/home")}</div></div>`;
        return;
      }
    }
    const html = await view(ctx);
    if (version !== renderVersion) return;
    activeContext = ctx;
    main.innerHTML = html;
    renderChrome(route);
    document.title = `${main.querySelector("h1")?.textContent || t("Racing our heritage", "نتسابق بروح تراثنا")} | Gulf Racing`;
    main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
    ctx.mounted?.();
  } catch (error) {
    if (version !== renderVersion || ctx.signal.aborted) return;
    main.innerHTML = `<div class="container page">${errorPanel(error)}</div>`;
    activeContext = ctx;
  } finally {
    if (version === renderVersion) main.removeAttribute("aria-busy");
  }
}
async function globalAction(name, button) {
  if (name === "menu") {
    const menu = document.querySelector("#main-nav"),
      open = menu.classList.toggle("open");
    button.setAttribute("aria-expanded", String(open));
    return true;
  }
  if (name === "language") {
    if (
      dirty &&
      !confirm(
        t(
          "Change language and discard unsaved changes?",
          "هل تريد تغيير اللغة وتجاهل التغييرات غير المحفوظة؟",
        ),
      )
    )
      return true;
    setLanguage(state.language === "ar" ? "en" : "ar");
    await render();
    return true;
  }
  if (name === "reload") {
    await render();
    return true;
  }
  if (name === "signout") {
    if (
      dirty &&
      !confirm(
        t(
          "Sign out and discard unsaved changes?",
          "هل تريد تسجيل الخروج وتجاهل التغييرات غير المحفوظة؟",
        ),
      )
    )
      return true;
    await api.send("/api/auth/logout");
    state.user = null;
    state.votes?.clear();
    api.clearCsrf();
    await api.refreshCsrf();
    toast(t("Signed out.", "تم تسجيل الخروج."));
    navigate("/");
    return true;
  }
  return false;
}
document.addEventListener("click", async (event) => {
  if (event.target.closest(".skip-link")) {
    event.preventDefault();
    main.focus();
    main.scrollIntoView();
    return;
  }
  const password = event.target.closest("[data-password]");
  if (password) {
    const input = document.getElementById(password.dataset.password),
      visible = input.type === "password";
    input.type = visible ? "text" : "password";
    password.textContent = visible ? t("Hide", "إخفاء") : t("Show", "إظهار");
    password.setAttribute("aria-pressed", String(visible));
    password.setAttribute(
      "aria-label",
      visible
        ? t("Hide password", "إخفاء كلمة المرور")
        : t("Show password", "إظهار كلمة المرور"),
    );
    return;
  }
  const anchor = event.target.closest('a[href^="#/"]');
  if (
    anchor &&
    dirty &&
    !confirm(
      t(
        "Leave this page and discard unsaved changes?",
        "هل تريد مغادرة الصفحة وتجاهل التغييرات غير المحفوظة؟",
      ),
    )
  ) {
    event.preventDefault();
    return;
  }
  const button = event.target.closest("[data-action]");
  if (!button || button.disabled || mutationActive) return;
  const name = button.dataset.action;
  button.disabled = true;
  mutationActive = true;
  try {
    if (!(await globalAction(name, button)))
      await activeContext?.actions[name]?.();
  } catch (error) {
    toast(error.message);
  } finally {
    button.disabled = false;
    mutationActive = false;
  }
});
document.addEventListener("input", (event) => {
  const formEl = event.target.closest("form[data-form]");
  if (formEl && !["filter", "select"].includes(formEl.dataset.form))
    dirty = true;
  event.target.removeAttribute("aria-invalid");
});
document.addEventListener("submit", async (event) => {
  const formEl = event.target.closest("form[data-form]");
  if (!formEl) return;
  event.preventDefault();
  if (mutationActive || !formEl.reportValidity()) return;
  const handler = activeContext?.forms[formEl.dataset.form];
  if (!handler) return;
  const buttons = [
    ...formEl.querySelectorAll("button[type=submit],button:not([type])"),
  ];
  buttons.forEach((b) => (b.disabled = true));
  formEl.setAttribute("aria-busy", "true");
  mutationActive = true;
  formEl.querySelector(".form-errors")?.replaceChildren();
  formEl.querySelector(".form-errors")?.classList.remove("notice", "success");
  formEl
    .querySelectorAll(".field-error")
    .forEach((el) => (el.textContent = ""));
  try {
    const result = await handler(values(formEl), formEl);
    dirty = false;
    if (result?.message && formEl.isConnected) {
      const box = formEl.querySelector(".form-errors");
      box.classList.add("notice", "success");
      box.textContent = result.message;
      box.focus();
    }
  } catch (error) {
    if (formEl.isConnected) showFormError(formEl, error);
    dirty = true;
  } finally {
    buttons.forEach((b) => (b.disabled = false));
    formEl.removeAttribute("aria-busy");
    mutationActive = false;
  }
});
document.addEventListener(
  "error",
  (event) => {
    if (
      event.target instanceof HTMLImageElement &&
      event.target.src !== new URL("assets/mark.svg", location.href).href
    ) {
      event.target.src = "assets/mark.svg";
      event.target.alt = t("Photo unavailable", "الصورة غير متاحة");
      event.target.classList.add("image-failed");
    }
  },
  true,
);
window.addEventListener("hashchange", render);
window.addEventListener("beforeunload", (event) => {
  if (dirty) {
    event.preventDefault();
    event.returnValue = "";
  }
});
window.addEventListener("session-expired", () => {
  if (!state.user) return;
  state.user = null;
  state.votes?.clear();
  api.clearCsrf();
  toast(
    t(
      "Your session expired. Please sign in again.",
      "انتهت جلستك. يرجى تسجيل الدخول مجددًا.",
    ),
  );
  navigate("/signin");
});
render();
restoreSession.then(() => {
  renderChrome(currentRoute());
});
