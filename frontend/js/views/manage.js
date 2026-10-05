import { api, query } from "../api.js";
import { state, t, can } from "../state.js";
import { navigate } from "../router.js";
import {
  heading,
  panel,
  link,
  action,
  icon,
  esc,
  badge,
  date,
  datetime,
  field,
  form,
  list,
  table,
  empty,
  pagination,
  localDateTime,
  toast,
} from "../ui.js";
export async function organizer(ctx) {
  const data = await ctx.get(
    "/api/races" +
      query({
        page: ctx.route.params.get("page") || 0,
        size: 20,
        search: ctx.route.params.get("search"),
      }),
  );
  ctx.forms.filter = (v) => navigate(`/organizer${query(v)}`);
  return `<div class="container page">${heading(t("Organizer Dashboard", "لوحة المنظّم"), t("Race management, from registration to results.", "إدارة السباقات من التسجيل حتى النتائج."), link(`${icon("plus")}${t("Add Race", "إضافة سباق")}`, "#/organizer/races/new"))}<form class="filters" data-form="filter"><div class="form-errors" role="alert"></div>${field("search", t("Find a race", "البحث عن سباق"), { required: false, value: ctx.route.params.get("search") || "" })}<button class="button secondary">${t("Search", "بحث")}</button></form>${table(
    [
      t("Race name", "اسم السباق"),
      t("Location", "الموقع"),
      t("Date", "التاريخ"),
      t("Distance", "المسافة"),
      t("Status", "الحالة"),
      t("Action", "الإجراء"),
    ],
    list(data).map((r) => [
      esc(r.name),
      esc(r.location),
      date(r.startsAt),
      `${r.distanceKm} km`,
      badge(r.status),
      can("ADMIN") || r.organizerId === state.user.userId
        ? link(
            t("Manage", "إدارة"),
            `#/organizer/races/${r.raceId}`,
            "button secondary small",
          )
        : link(t("View", "عرض"), `#/races/${r.raceId}`, "text-link"),
    ]),
  )}${pagination(data, ctx.route.params, "/organizer")}</div>`;
}
export async function raceForm(ctx) {
  const edit = Boolean(ctx.id),
    r = edit ? await ctx.get(`/api/races/${ctx.id}`) : {};
  if (edit && !can("ADMIN") && r.organizerId !== state.user.userId)
    return `<div class="container page">${empty(t("You cannot manage this race", "لا يمكنك إدارة هذا السباق"))}</div>`;
  const transitions = {
    SCHEDULED: ["SCHEDULED", "OPEN", "CANCELLED"],
    OPEN: ["OPEN", "CLOSED", "CANCELLED"],
    CLOSED: ["CLOSED", "COMPLETED", "CANCELLED"],
    COMPLETED: ["COMPLETED"],
    CANCELLED: ["CANCELLED"],
  };
  ctx.forms.race = async (v) => {
    const dto = {
      name: v.name,
      location: v.location,
      distanceKm: Number(v.distanceKm),
      startsAt: new Date(v.startsAt).toISOString(),
      status: v.status,
      resultsImageUrl: v.resultsImageUrl || null,
      organizerId: edit ? r.organizerId : state.user.userId,
      organizationId: v.organizationId ? Number(v.organizationId) : null,
    };
    const saved = await api.send(
      edit ? `/api/races/${ctx.id}` : "/api/races",
      edit ? "PUT" : "POST",
      dto,
    );
    toast(t("Race saved.", "تم حفظ السباق."));
    if (edit) await ctx.reload();
    else navigate(`/organizer/races/${saved.raceId}`);
  };
  let entries = [],
    results = [];
  if (edit)
    [entries, results] = await Promise.all([
      ctx.get(`/api/race-entries/race/${ctx.id}`),
      ctx.get("/api/race-results"),
    ]);
  for (const e of entries) {
    for (const status of ["ACCEPTED", "REJECTED"])
      ctx.actions[`${status}-${e.entryId}`] = async () => {
        await api.send(`/api/race-entries/${e.entryId}`, "PUT", {
          entryStatus: status,
        });
        toast(t("Entry updated.", "تم تحديث المشاركة."));
        await ctx.reload();
      };
    const result = results.find((result) => result.entryId === e.entryId);
    ctx.forms[`result-${e.entryId}`] = async (v) => {
      await api.send(
        result ? `/api/race-results/${e.entryId}` : "/api/race-results",
        result ? "PUT" : "POST",
        {
          entryId: e.entryId,
          finishPosition: Number(v.finishPosition),
          elapsedMs: Number(v.elapsedMs),
        },
      );
      toast(t("Result saved.", "تم حفظ النتيجة."));
      await ctx.reload();
    };
  }
  ctx.actions.publish = async () => {
    await api.send(`/api/race-cards/races/${ctx.id}/publish`);
    toast(t("Race card published.", "تم نشر بطاقة السباق."));
  };
  const entryControls = (e) => {
    if (
      e.entryStatus === "PENDING" &&
      ["OPEN", "CLOSED"].includes(r.status) &&
      new Date(r.startsAt) > new Date()
    )
      return `<div class="actions">${action(t("Accept", "قبول"), `ACCEPTED-${e.entryId}`, "button small")}${action(t("Reject", "رفض"), `REJECTED-${e.entryId}`, "button danger small")}</div>`;
    if (e.entryStatus !== "ACCEPTED") return "—";
    const result = results.find((result) => result.entryId === e.entryId);
    return `<details><summary>${t("Record result", "تسجيل النتيجة")}</summary>${form(`result-${e.entryId}`, field("finishPosition", t("Finish position", "مركز الوصول"), { type: "number", min: 1, step: 1, value: result?.finishPosition || "" }) + field("elapsedMs", t("Elapsed time (milliseconds)", "الوقت المستغرق (ميلي ثانية)"), { type: "number", min: 1, step: 1, value: result?.elapsedMs || "" }), t("Save Result", "حفظ النتيجة"))}</details>`;
  };
  return `<div class="container page">${link(t("← Organizer dashboard", "لوحة المنظّم ←"), "#/organizer", "back-link")}${heading(edit ? t("Manage Race", "إدارة السباق") : t("Add Race", "إضافة سباق"), edit ? esc(r.name) : "", edit ? link(t("View Public Page", "عرض الصفحة العامة"), `#/races/${ctx.id}`, "button secondary") : "")}${panel(form("race", `<div class="form-grid">${field("name", t("Race name", "اسم السباق"), { value: r.name || "", maxlength: 150 })}${field("location", t("Location", "الموقع"), { value: r.location || "", maxlength: 255 })}${field("startsAt", t("Date & time", "التاريخ والوقت"), { type: "datetime-local", value: r.startsAt ? localDateTime(r.startsAt) : "" })}${field("distanceKm", t("Distance (km)", "المسافة (كم)"), { type: "number", min: ".001", step: ".001", value: r.distanceKm || "" })}${field("status", t("Status", "الحالة"), { value: r.status || "SCHEDULED", options: (edit ? transitions[r.status] : ["SCHEDULED", "OPEN"]).map((s) => [s, s]) })}${field("organizationId", t("Organization ID (optional)", "رقم المؤسسة (اختياري)"), { type: "number", min: 1, step: 1, required: false, value: r.organizationId || "" })}</div>` + field("resultsImageUrl", t("Official results image URL", "رابط صورة النتائج الرسمية"), { type: "url", value: r.resultsImageUrl || "", required: false, maxlength: 2048 }), t("Save Race", "حفظ السباق")))}${
    edit
      ? `<section class="section"><div class="section-heading"><h2>${t("Race Entries", "المشاركات")}</h2>${action(t("Publish Race Card", "نشر بطاقة السباق"), "publish")}</div>${table(
          [
            t("Number", "الرقم"),
            t("Camel", "الهجن"),
            t("Registrant", "المسجّل"),
            t("Status", "الحالة"),
            t("Manage", "إدارة"),
          ],
          entries.map((e) => [
            e.participantNumber,
            link(`#${e.camelId}`, `#/camels/${e.camelId}`, "text-link"),
            `#${e.registrantId}`,
            badge(e.entryStatus),
            entryControls(e),
          ]),
        )}</section>`
      : ""
  }</div>`;
}
export async function admin(ctx) {
  const p = ctx.route.params,
    data = await ctx.get(
      `/api/admin/users${query({ page: p.get("page") || 0, size: 20 })}`,
    );
  const roles = ["VIEWER", "OWNER", "TRAINER", "ORGANIZER", "ADMIN"];
  for (const u of data.content) {
    ctx.forms[`roles-${u.userId}`] = async (v, el) => {
      const selected = new FormData(el).getAll("roles");
      if (!selected.length)
        throw new Error(
          t("Select at least one role.", "اختر دورًا واحدًا على الأقل."),
        );
      if (
        !confirm(
          t(
            `Update roles for ${u.fullName}? Their existing session will expire.`,
            `تحديث أدوار ${u.fullName}؟ ستنتهي جلسته الحالية.`,
          ),
        )
      )
        return;
      await api.send(`/api/admin/users/${u.userId}/roles`, "PUT", {
        roles: selected,
      });
      toast(t("Roles updated.", "تم تحديث الأدوار."));
      await ctx.reload();
    };
    ctx.forms[`status-${u.userId}`] = async (v) => {
      if (
        !confirm(
          t(
            `Set ${u.fullName} to ${v.status}?`,
            `تعيين حالة ${u.fullName} إلى ${v.status}؟`,
          ),
        )
      )
        return;
      await api.send(`/api/admin/users/${u.userId}/status`, "PUT", {
        status: v.status,
      });
      toast(t("Account status updated.", "تم تحديث حالة الحساب."));
      await ctx.reload();
    };
  }
  return `<div class="container page">${heading(t("Admin Dashboard", "لوحة الإدارة"), t("People, access and the racing community.", "المستخدمون والصلاحيات ومجتمع السباقات."))}<nav class="tabs"><a href="#/admin" aria-current="page">${t("Users", "المستخدمون")}</a><a href="#/camels">${t("Camels", "الهجن")}</a><a href="#/settings">${t("My Settings", "إعداداتي")}</a></nav>${table(
    [
      t("Name", "الاسم"),
      t("Roles", "الأدوار"),
      t("Status", "الحالة"),
      t("Manage", "إدارة"),
    ],
    data.content.map((u) => [
      `${esc(u.fullName)}<br><small class="muted">${esc(u.email)}</small>`,
      u.roles.map(esc).join(", "),
      badge(u.accountStatus),
      `<details><summary>${t("Manage access", "إدارة الصلاحيات")}</summary>${form(`roles-${u.userId}`, `<fieldset><legend>${t("Roles", "الأدوار")}</legend><div class="role-options">${roles.map((r) => `<label class="check-label"><input type="checkbox" name="roles" value="${r}" ${u.roles.includes(r) ? "checked" : ""}>${r}</label>`).join("")}</div></fieldset>`, t("Save Roles", "حفظ الأدوار"))}${form(`status-${u.userId}`, field("status", t("Account status", "حالة الحساب"), { value: u.accountStatus, options: ["ACTIVE", "INACTIVE", "SUSPENDED"].map((s) => [s, s]) }), t("Update Status", "تحديث الحالة"))}</details>`,
    ]),
  )}${pagination(data, p, "/admin")}<p class="field-hint">${t("New users create their own accounts. An administrator then assigns the required roles.", "ينشئ المستخدم حسابه أولًا، ثم يُسنِد له المسؤول الأدوار المناسبة.")}</p></div>`;
}
