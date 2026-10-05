import { t, state } from "./state.js";
export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const list = (value) =>
  Array.isArray(value) ? value : value?.content || [];
export function safeImage(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? esc(url.href) : "";
  } catch {
    return "";
  }
}
const paths = {
  arrow: "M4 12h16m-6-6 6 6-6 6",
  calendar:
    "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Zm2 10h3m4 0h3m-10 4h3",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  cup: "M8 3h8v8a4 4 0 0 1-8 0V3Zm8 2h4v3a5 5 0 0 1-4 5M8 5H4v3a5 5 0 0 0 4 5m4 2v5m-5 1h10",
  user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-3a8 8 0 0 1 16 0v3",
  search: "M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
  bag: "M4 7h16l1 14H3L4 7Zm4 0V5a4 4 0 0 1 8 0v2",
  book: "M4 3h12l4 4v14H4V3Zm11 0v5h5M8 12h8m-8 4h6",
  plus: "M12 4v16M4 12h16",
  clock: "M12 7v5l4 2M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0Z",
  menu: "M4 6h16M4 12h16M4 18h16",
  globe:
    "M2 12h20M12 2a17 17 0 0 1 0 20 17 17 0 0 1 0-20Zm10 10A10 10 0 1 1 2 12a10 10 0 0 1 20 0Z",
  check: "m5 12 4 4L19 6",
  lock: "M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4",
};
export const icon = (name, cls = "") =>
  `<svg class="icon ${esc(cls)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.book}"/></svg>`;
export const brand = () =>
  `<a class="brand" href="#/" aria-label="Gulf Racing home"><img src="assets/mark.svg" alt="" width="44" height="36"><span>GULF RACING<small>${t("THE SPIRIT OF OMAN", "روح عُمان")}</small></span></a>`;
export const link = (label, href, cls = "button") =>
  `<a class="${cls}" href="${esc(href)}">${label}</a>`;
export const action = (label, name, cls = "button secondary", attrs = "") =>
  `<button type="button" class="${cls}" data-action="${esc(name)}" ${attrs}>${label}</button>`;
export const date = (value) =>
  value
    ? new Intl.DateTimeFormat(state.language === "ar" ? "ar-OM" : "en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "—";
export const datetime = (value) =>
  value
    ? new Intl.DateTimeFormat(state.language === "ar" ? "ar-OM" : "en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
export const money = (value) =>
  new Intl.NumberFormat(state.language === "ar" ? "ar-OM" : "en-OM", {
    style: "currency",
    currency: "OMR",
    minimumFractionDigits: 3,
  }).format(Number(value || 0));
export const localDateTime = (value) => {
  const d = new Date(value || Date.now());
  return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export const statusLabel = (value) => {
  const labels = {
    ACTIVE: "نشط",
    INACTIVE: "غير نشط",
    SCHEDULED: "مجدول",
    OPEN: "مفتوح",
    CLOSED: "مغلق",
    COMPLETED: "مكتمل",
    CANCELLED: "ملغي",
    AVAILABLE: "متاح",
    SOLD: "مباع",
    RETIRED: "متقاعد",
    PENDING: "معلّق",
    PENDING_APPROVAL: "بانتظار الموافقة",
    ACCEPTED: "مقبول",
    REJECTED: "مرفوض",
    DECLINED: "مرفوض",
    TERMINATED: "منتهٍ",
    EXPIRED: "منتهي الصلاحية",
    SUSPENDED: "موقوف",
    DRAFT: "مسودة",
  };
  return state.language === "ar" && labels[value]
    ? labels[value]
    : String(value || "")
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^./, (c) => c.toUpperCase());
};
export const badge = (value) =>
  `<span class="badge badge-${esc(String(value).toLowerCase())}">${esc(statusLabel(value))}</span>`;
export const heading = (title, subtitle = "", actions = "") =>
  `<div class="page-heading"><div><p class="eyebrow">${t("GULF RACING · OMAN", "سباقات الخليج · عُمان")}</p><h1>${title}</h1>${subtitle ? `<p class="muted">${subtitle}</p>` : ""}</div><div class="actions">${actions}</div></div>`;
export const empty = (
  title = t("Nothing here yet", "لا توجد بيانات بعد"),
  description = "",
  call = "",
) =>
  `<div class="empty">${icon("book")}<h3>${esc(title)}</h3><p>${esc(description)}</p>${call}</div>`;
export const panel = (content, cls = "") =>
  `<section class="panel ${cls}">${content}</section>`;
export const errorPanel = (error) =>
  `<div class="notice error" role="alert"><strong>${t("Something needs attention", "تعذّر إكمال الطلب")}</strong><p>${esc(error.message)}</p>${action(t("Try again", "إعادة المحاولة"), "reload", "button secondary small")}</div>`;
export const image = (url, alt, cls = "") =>
  safeImage(url)
    ? `<img class="${cls}" src="${safeImage(url)}" alt="${esc(alt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
    : `<div class="image-placeholder ${cls}" role="img" aria-label="${esc(t("No photo available", "لا توجد صورة"))}"><img src="assets/mark.svg" alt="" width="64" height="52"><span>${t("Photo not added", "لم تُضف صورة")}</span></div>`;
let fieldSequence = 0;
export function field(
  name,
  label,
  {
    type = "text",
    value = "",
    required = true,
    hint = "",
    options = null,
    ...attrs
  } = {},
) {
  const uid = `${name}-${++fieldSequence}`;
  const attrText = Object.entries(attrs)
    .map(([k, v]) => `${k}="${esc(v)}"`)
    .join(" ");
  const common = `id="field-${uid}" name="${name}" ${required ? "required" : ""} ${attrText} aria-describedby="hint-${uid} error-${uid}"`;
  const control = options
    ? `<select ${common}>${options.map(([v, l]) => `<option value="${esc(v)}" ${String(value) === String(v) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`
    : type === "textarea"
      ? `<textarea ${common} rows="4">${esc(value)}</textarea>`
      : `<input ${common} type="${type}" value="${esc(value)}">`;
  return `<div class="field"><label for="field-${uid}">${label}${required ? ' <span class="required" aria-hidden="true">*</span>' : ""}</label>${type === "password" ? `<div class="password-control">${control}<button type="button" data-password="field-${uid}" aria-label="${t("Show password", "إظهار كلمة المرور")}" aria-pressed="false">${t("Show", "إظهار")}</button></div>` : control}<small id="hint-${uid}" class="field-hint">${hint}</small><small id="error-${uid}" class="field-error"></small></div>`;
}
export const form = (
  name,
  contents,
  submit = t("Save changes", "حفظ التغييرات"),
  extra = "",
) =>
  `<form data-form="${name}"><div class="form-errors" role="alert" tabindex="-1"></div>${contents}<div class="form-actions"><button type="submit" class="button">${submit}</button>${extra}</div></form>`;
export function table(headers, rows, caption = "") {
  return rows.length
    ? `<div class="table-wrap"><table>${caption ? `<caption class="sr-only">${esc(caption)}</caption>` : ""}<thead><tr>${headers.map((x) => `<th scope="col">${x}</th>`).join("")}</tr></thead><tbody>${rows.map((cells) => `<tr>${cells.map((c) => `<td>${c ?? "—"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
    : empty(t("No records yet", "لا توجد سجلات بعد"));
}
export function pagination(data, params, path) {
  const page = data.page ?? data.number ?? 0;
  const total = data.totalPages ?? 1;
  if (total <= 1) return "";
  const href = (p) => {
    const q = new URLSearchParams(params);
    q.set("page", p);
    return `#${path}?${q}`;
  };
  return `<nav class="pagination" aria-label="${t("Pagination", "الصفحات")}">${page > 0 ? link(t("Previous", "السابق"), href(page - 1), "button secondary small") : ""}<span>${page + 1} / ${total}</span>${page + 1 < total ? link(t("Next", "التالي"), href(page + 1), "button secondary small") : ""}</nav>`;
}
export function toast(message) {
  const el = document.querySelector("#notifications");
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("visible"), 5000);
}
export function values(formEl) {
  return Object.fromEntries(new FormData(formEl));
}
export function showFormError(formEl, error) {
  const box = formEl.querySelector(".form-errors");
  box.textContent = error.message;
  box.focus();
  const fields = error.fields || {};
  for (const [key, message] of Object.entries(fields)) {
    const input = formEl.elements.namedItem(key);
    if (input?.setAttribute) {
      input.setAttribute("aria-invalid", "true");
      const errorId = input.getAttribute("aria-describedby")?.split(" ").at(-1);
      const el = errorId ? document.getElementById(errorId) : null;
      if (el) el.textContent = String(message);
    }
  }
}
export const camelOptions = (camels) => [
  ["", t("Select a camel", "اختر هجنًا")],
  ...camels.map((c) => [c.camelId, `${c.name} · #${c.camelId}`]),
];
export const number = (value) =>
  value === "" || value === undefined ? null : Number(value);
