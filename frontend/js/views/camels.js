import { api, query } from "../api.js";
import { state, t, can } from "../state.js";
import { navigate } from "../router.js";
import {
  heading,
  link,
  action,
  icon,
  panel,
  esc,
  badge,
  date,
  field,
  form,
  list,
  empty,
  image,
  pagination,
  number,
  toast,
} from "../ui.js";

export function camelCard(c) {
  return `<article class="card">${image(c.photoUrl, c.name, "card-image")}<div class="card-body"><div class="card-top"><h3>${esc(c.name)}</h3>${badge(c.status)}</div><p class="muted">#${c.camelId} · ${esc(c.breed)} · ${esc(c.gender)}</p>${link(t("View Profile", "عرض الملف"), `#/camels/${c.camelId}`, "button secondary small")}</div></article>`;
}
export async function camels(ctx) {
  const mine = ctx.route.path === "/my-camels";
  const q = ctx.route.params;
  const data = await ctx.get(
    mine
      ? "/camel/my-camels"
      : "/camel/getAll" +
          query({
            page: q.get("page") || 0,
            size: 12,
            search: q.get("search"),
            gender: q.get("gender"),
          }),
  );
  ctx.forms.filter = (v) => navigate(`/camels${query(v)}`);
  return `<div class="container page">${heading(mine ? t("My Camels", "الهجن الخاصة بي") : t("Camel Directory", "دليل الهجن"), t("Their stories, their lineage, their legacy.", "قصص الهجن وأنسابها وإرثها."), can("OWNER", "ADMIN") ? link(`${icon("plus")}${t("Add Camel", "إضافة هجن")}`, "#/camels/new") : "")}${
    mine
      ? ""
      : `<form data-form="filter" class="filters"><div class="form-errors" role="alert"></div>${field("search", t("Search camels", "البحث عن الهجن"), { required: false, value: q.get("search") || "", placeholder: t("Camel name", "اسم الهجن") })}${field(
          "gender",
          t("Sex", "الجنس"),
          {
            required: false,
            value: q.get("gender") || "",
            options: [
              ["", t("All", "الكل")],
              ["MALE", t("Male", "ذكر")],
              ["FEMALE", t("Female", "أنثى")],
            ],
          },
        )}<button class="button">${icon("search")}${t("Search", "بحث")}</button></form>`
  }<div class="grid grid-3">${list(data).length ? list(data).map(camelCard).join("") : empty(t("No camels found", "لم يُعثر على هجن"), mine ? t("Add your first camel to start building its profile.", "أضف أول هجن لبدء بناء ملفه.") : t("Try a different search.", "جرّب بحثًا آخر."))}</div>${mine ? "" : pagination(data, q, "/camels")}</div>`;
}
export async function camelProfile(ctx) {
  const c = await ctx.get(`/camel/profile?id=${ctx.id}`);
  let owned = false;
  if (can("OWNER", "ADMIN"))
    owned =
      can("ADMIN") ||
      list(await ctx.get("/camel/my-camels")).some(
        (item) => item.camelId === ctx.id,
      );
  const family = c.pedigree || {};
  return `<div class="container page">${link(t("← All camels", "كل الهجن ←"), "#/camels", "back-link")}${heading(esc(c.name), `#${c.camelId} · ${esc(c.category || t("Racing camel", "هجن سباق"))}`, owned ? link(t("Edit Camel", "تعديل الهجن"), `#/camels/${ctx.id}/edit`, "button secondary") : "")}<div class="detail-grid">${image(c.photoUrl, c.name, "detail-photo")}<section>${badge(c.status)}<dl class="profile-meta"><div><dt>${t("Breed", "السلالة")}</dt><dd>${esc(c.breed)}</dd></div><div><dt>${t("Date of birth", "تاريخ الميلاد")}</dt><dd>${date(c.birthDate)}</dd></div><div><dt>${t("Sex", "الجنس")}</dt><dd>${esc(c.gender)}</dd></div><div><dt>${t("Current owners", "المالكون الحاليون")}</dt><dd>${c.owners.map((o) => `${esc(o.name)} (${esc(o.sharePercent)}%)`).join("<br>") || "—"}</dd></div></dl><h2>${t("Pedigree", "النسب")}</h2><div class="pedigree section">${[
    [t("Sire", "الأب"), family.sire, family.sireCamelId],
    [t("Dam", "الأم"), family.dam, family.damCamelId],
  ]
    .map(([label, name, id]) =>
      panel(
        `<p class="eyebrow">${label}</p><h3>${id ? link(esc(name || `#${id}`), `#/camels/${id}`, "text-link") : esc(name || t("Not recorded", "غير مسجّل"))}</h3>`,
      ),
    )
    .join(
      "",
    )}</div><div class="actions section">${link(t("Ownership History", "سجل الملكية"), `#/camels/${ctx.id}/ownership`, "button secondary")}${c.activeListing ? link(t("View Sale Listing", "عرض إعلان البيع"), `#/marketplace/${c.activeListing.listingId}`) : ""}</div></section></div></div>`;
}
export async function ownership(ctx) {
  const [c, history] = await Promise.all([
    ctx.get(`/camel/getById?id=${ctx.id}`),
    ctx.get(`/camel/ownership-history?id=${ctx.id}`),
  ]);
  return `<div class="container page">${link(esc(c.name), `#/camels/${ctx.id}`, "back-link")}${heading(t("Ownership History", "سجل الملكية"), esc(c.name))}<div class="detail-grid">${image(c.photoUrl, c.name, "detail-photo")}<section class="panel"><h2>${t("A history to preserve", "تاريخ يستحق الحفاظ عليه")}</h2>${history.length ? `<ol class="timeline">${history.map((o) => `<li><small>${date(o.startAt)} — ${o.current ? t("Present", "حتى الآن") : date(o.endAt)}</small><strong>${esc(o.ownerName)}</strong><small>${esc(o.sharePercent)}% · ${o.current ? t("Current owner", "مالك حالي") : t("Previous owner", "مالك سابق")}</small></li>`).join("")}</ol>` : empty(t("No ownership history", "لا يوجد سجل ملكية"))}</section></div></div>`;
}
export async function camelForm(ctx) {
  const edit = Boolean(ctx.id);
  const c = edit ? await ctx.get(`/camel/getById?id=${ctx.id}`) : {};
  ctx.forms.camel = async (v) => {
    const body = {
      ...v,
      camelId: edit ? ctx.id : undefined,
      birthDate: `${v.birthDate}T00:00:00.000Z`,
      photoUrl: v.photoUrl || null,
      sire: v.sire || null,
      dam: v.dam || null,
      category: v.category || null,
    };
    const result = await api.send(
      edit ? "/camel/update" : "/camel/add",
      edit ? "PUT" : "POST",
      body,
    );
    toast(t("Camel saved.", "تم حفظ الهجن."));
    navigate(`/camels/${edit ? ctx.id : result}`);
  };
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `<div class="container page">${heading(edit ? t("Edit Camel", "تعديل الهجن") : t("Add New Camel", "إضافة هجن جديد"), t("Keep every detail of your camel in one place.", "احتفظ بكل تفاصيل الهجن في مكان واحد."))}<div class="detail-grid"><div>${image(c.photoUrl, c.name || t("Camel photo", "صورة الهجن"), "detail-photo")}<p class="field-hint">${t("Use a hosted photo URL. Direct photo upload is not available yet.", "استخدم رابط صورة مستضافة. رفع الصور مباشرة غير متاح بعد.")}</p></div>${panel(
    form(
      "camel",
      field("name", t("Camel name", "اسم الهجن"), {
        value: c.name || "",
        minlength: 2,
        maxlength: 50,
      }) +
        `<div class="form-grid">${field("birthDate", t("Date of birth", "تاريخ الميلاد"), { type: "date", value: c.birthDate?.slice(0, 10) || "", max: yesterday.toISOString().slice(0, 10) })}${field(
          "gender",
          t("Sex", "الجنس"),
          {
            value: c.gender || "MALE",
            options: [
              ["MALE", t("Male", "ذكر")],
              ["FEMALE", t("Female", "أنثى")],
            ],
          },
        )}</div>` +
        field("breed", t("Breed", "السلالة"), {
          value: c.breed || "",
          minlength: 2,
          maxlength: 50,
        }) +
        field("photoUrl", t("Photo URL", "رابط الصورة"), {
          type: "url",
          value: c.photoUrl || "",
          required: false,
          maxlength: 2048,
          placeholder: "https://…",
        }) +
        `<div class="form-grid">${field("sire", t("Sire name", "اسم الأب"), { value: c.sire || "", required: false, maxlength: 100 })}${field("dam", t("Dam name", "اسم الأم"), { value: c.dam || "", required: false, maxlength: 100 })}</div>` +
        field("category", t("Category", "الفئة"), {
          value: c.category || "",
          required: false,
          maxlength: 50,
        }) +
        field("status", t("Status", "الحالة"), {
          value: c.status || "ACTIVE",
          options: [
            ...new Set([c.status || "ACTIVE", "ACTIVE", "RETIRED"]),
          ].map((status) => [status, status]),
        }),
      t("Save Camel", "حفظ الهجن"),
      link(
        t("Cancel", "إلغاء"),
        edit ? `#/camels/${ctx.id}` : "#/my-camels",
        "text-link",
      ),
    ),
  )}</div></div>`;
}
