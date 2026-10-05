import { api } from "../api.js";
import { state, t, can } from "../state.js";
import { navigate } from "../router.js";
import {
  heading,
  panel,
  link,
  action,
  esc,
  badge,
  date,
  datetime,
  money,
  field,
  form,
  table,
  empty,
  camelOptions,
  localDateTime,
  toast,
} from "../ui.js";
import { camelCard } from "./camels.js";
export async function trainers(ctx) {
  const trainers = await ctx.get("/trainer-profile/getAll");
  return `<div class="container page">${heading(t("Mudammer Directory", "دليل المضمّرين"), t("Find the right care for your camel’s next chapter.", "اختر الرعاية المناسبة للمرحلة القادمة من رحلة الهجن."), can("TRAINER") ? link(t("My trainer profile", "ملف المضمّر الخاص بي"), "#/trainer-profile", "button secondary") : "")}<div class="grid grid-3">${trainers.length ? trainers.map((p) => `<article class="card"><div class="trainer-initials" aria-hidden="true">${String(p.userId).padStart(2, "0")}</div><div class="card-body"><h3>${t("Mudammer", "المضمّر")} #${p.userId}</h3><p class="muted">${esc(p.bio || t("No biography provided.", "لم تُضف نبذة بعد."))}</p><p class="meta-row">${esc(p.location || t("Location not provided", "لم يُحدّد الموقع"))}</p>${can("OWNER", "ADMIN") ? link(t("Select Mudammer", "اختيار المضمّر"), `#/agreements/new?trainer=${p.userId}`) : link(t("Sign in as an owner to propose a partnership", "سجّل الدخول كمالك لاقتراح شراكة"), "#/signin", "text-link")}</div></article>`).join("") : empty(t("No trainers listed yet", "لم يُضف مضمّرون بعد"))}</div></div>`;
}
export async function agreementForm(ctx) {
  const [camels, trainers] = await Promise.all([
    ctx.get("/camel/my-camels"),
    ctx.get("/trainer-profile/getAll"),
  ]);
  ctx.forms.agreement = async (v) => {
    if (new Date(v.endsAt) <= new Date(v.startsAt))
      throw new Error(
        t(
          "The end date must be after the start date.",
          "يجب أن يكون تاريخ النهاية بعد تاريخ البداية.",
        ),
      );
    await api.send("/api/agreements", "POST", {
      camelId: Number(v.camelId),
      trainerUserId: Number(v.trainerUserId),
      feeOmr: Number(v.feeOmr),
      prizeSharePct: Number(v.prizeSharePct),
      saleSharePct: Number(v.saleSharePct),
      startsAt: new Date(v.startsAt).toISOString(),
      endsAt: new Date(v.endsAt).toISOString(),
    });
    toast(
      t("Agreement sent to the Mudammer.", "تم إرسال الاتفاق إلى المضمّر."),
    );
    navigate("/agreements");
  };
  return `<div class="container page compact">${heading(t("Create Training Agreement", "إنشاء اتفاق تدريب"), t("Set clear terms for a successful partnership.", "حدّد شروطًا واضحة لشراكة ناجحة."))}${panel(form("agreement", field("trainerUserId", t("Select Mudammer", "اختيار المضمّر"), { value: ctx.route.params.get("trainer") || "", options: [["", t("Select a trainer", "اختر المضمّر")], ...trainers.map((p) => [p.userId, `${t("Mudammer", "المضمّر")} #${p.userId} · ${p.location || ""}`])] }) + field("camelId", t("Select camel", "اختيار الهجن"), { options: camelOptions(camels) }) + `<div class="form-grid">${field("startsAt", t("Start date & time", "تاريخ ووقت البداية"), { type: "datetime-local" })}${field("endsAt", t("End date & time", "تاريخ ووقت النهاية"), { type: "datetime-local" })}</div>` + field("feeOmr", t("Training fee (OMR)", "رسوم التدريب (ر.ع.)"), { type: "number", min: 0, max: 999999999.999, step: ".001", value: "0" }) + `<div class="form-grid">${field("prizeSharePct", t("Trainer prize share (%)", "حصة المضمّر من الجائزة (%)"), { type: "number", min: 0, max: 100, step: ".01", value: "0" })}${field("saleSharePct", t("Trainer sale share (%)", "حصة المضمّر من البيع (%)"), { type: "number", min: 0, max: 100, step: ".01", value: "0" })}</div><p class="field-hint">${t("You must own 100% of the camel. The trainer must accept before training begins.", "يجب أن تملك الهجن بالكامل. على المضمّر قبول الاتفاق قبل بدء التدريب.")}</p>`, t("Send Agreement", "إرسال الاتفاق")))}</div>`;
}
export async function agreements(ctx) {
  const agreements = await ctx.get("/api/agreements/mine");
  const filter = ctx.route.params.get("status") || "";
  const shown = filter
    ? agreements.filter((a) => a.status === filter)
    : agreements;
  for (const a of agreements)
    for (const verb of ["accept", "reject", "terminate"])
      ctx.actions[`${verb}-${a.agreementId}`] = async () => {
        if (
          !confirm(
            t(
              `${verb === "accept" ? "Accept" : verb === "reject" ? "Reject" : "Terminate"} agreement #${a.agreementId}?`,
              `${verb === "accept" ? "قبول" : verb === "reject" ? "رفض" : "إنهاء"} الاتفاق رقم ${a.agreementId}؟`,
            ),
          )
        )
          return;
        await api.send(`/api/agreements/${a.agreementId}/${verb}`);
        toast(t("Agreement updated.", "تم تحديث الاتفاق."));
        await ctx.reload();
      };
  return `<div class="container page">${heading(t("My Agreements", "اتفاقياتي"), t("Your partnerships, from proposal to the finish line.", "شراكاتك من تقديم الطلب حتى خط النهاية."), can("OWNER", "ADMIN") ? link(t("Create Agreement", "إنشاء اتفاق"), "#/agreements/new") : "")}<nav class="tabs" aria-label="${t("Agreement status", "حالة الاتفاق")}">${[
    ["", t("All", "الكل")],
    ["PENDING_APPROVAL", t("Pending", "معلّقة")],
    ["ACTIVE", t("Active", "نشطة")],
    ["TERMINATED", t("Ended", "منتهية")],
  ]
    .map(
      ([v, label]) =>
        `<a href="#/agreements${v ? "?status=" + v : ""}" ${filter === v ? 'aria-current="page"' : ""}>${label}</a>`,
    )
    .join(
      "",
    )}</nav>${shown.length ? shown.map((a) => `<article class="agreement-row"><div class="card-top"><h3>${link(`${t("Camel", "الهجن")} #${a.camelId}`, `#/camels/${a.camelId}`, "text-link")}</h3>${badge(a.status)}</div><p class="muted">${t("Owner", "المالك")} #${a.ownerUserId} · ${t("Mudammer", "المضمّر")} #${a.trainerUserId}</p><p class="meta-row">${date(a.startsAt)} — ${date(a.endsAt)} · ${money(a.feeOmr)}</p><p class="field-hint">${t("Prize share", "حصة الجائزة")}: ${a.prizeSharePct}% · ${t("Sale share", "حصة البيع")}: ${a.saleSharePct}%</p><div class="actions section">${link(t("Training Log", "سجل التدريب"), `#/training?agreement=${a.agreementId}`, "button secondary small")}${a.status === "PENDING_APPROVAL" && a.trainerUserId === state.user.userId ? action(t("Accept", "قبول"), `accept-${a.agreementId}`, "button small") + action(t("Reject", "رفض"), `reject-${a.agreementId}`, "button danger small") : ""}${a.status === "ACTIVE" || (a.status === "PENDING_APPROVAL" && a.ownerUserId === state.user.userId) ? action(t("Terminate", "إنهاء"), `terminate-${a.agreementId}`, "button danger small") : ""}</div></article>`).join("") : empty(t("No agreements here yet", "لا توجد اتفاقيات هنا بعد"))}</div>`;
}
export async function assigned(ctx) {
  // The current controller exposes /mine, but not the /assigned route mentioned in older docs.
  const agreements = (await ctx.get("/api/agreements/mine")).filter(
    (a) => a.trainerUserId === state.user.userId && a.status === "ACTIVE",
  );
  const camels = await Promise.all(
    agreements.map((a) => ctx.get(`/camel/getById?id=${a.camelId}`)),
  );
  return `<div class="container page">${heading(t("My Assigned Camels", "الهجن المسندة إليّ"), t("Camels under your training.", "الهجن التي تتولى تدريبها."), link(t("Training Log", "سجل التدريب"), "#/training"))}<div class="grid grid-3">${camels.length ? camels.map(camelCard).join("") : empty(t("No active assignments", "لا توجد إسنادات نشطة"), t("Accepted active agreements appear here.", "تظهر هنا اتفاقيات التدريب النشطة المقبولة."))}</div></div>`;
}
export async function training(ctx) {
  const agreements = await ctx.get("/api/agreements/mine");
  const selected = ctx.route.params.get("agreement");
  const a = selected
    ? agreements.find((item) => item.agreementId === Number(selected))
    : agreements.find((item) => item.status === "ACTIVE") || agreements[0];
  ctx.forms.select = (v) => navigate(`/training?agreement=${v.agreementId}`);
  const logs = a
    ? await ctx.get(`/api/training-logs/agreement/${a.agreementId}`)
    : [];
  const now = new Date();
  const writable =
    a &&
    can("TRAINER") &&
    a.trainerUserId === state.user.userId &&
    a.status === "ACTIVE" &&
    new Date(a.startsAt) <= now &&
    now <= new Date(a.endsAt);
  ctx.forms.training = async (v) => {
    await api.send("/api/training-logs", "POST", {
      agreementId: a.agreementId,
      sessionAt: new Date(v.sessionAt).toISOString(),
      durationMinutes: Number(v.durationMinutes),
      notes: v.notes,
    });
    toast(t("Training session recorded.", "تم تسجيل جلسة التدريب."));
    await ctx.reload();
  };
  return `<div class="container page">${heading(t("Training Log", "سجل التدريب"), t("Record the work behind every performance.", "سجّل الجهد الذي يقف خلف كل أداء."))}${agreements.length ? panel(`<form class="filters" data-form="select"><div class="form-errors" role="alert"></div>${field("agreementId", t("Agreement / Camel", "الاتفاق / الهجن"), { value: a?.agreementId || "", options: agreements.map((item) => [item.agreementId, `#${item.agreementId} · ${t("Camel", "الهجن")} #${item.camelId} · ${item.status}`]) })}<button class="button secondary">${t("View Log", "عرض السجل")}</button></form>${selected && !a ? empty(t("Agreement not found in your partnerships", "الاتفاق غير موجود ضمن شراكاتك")) : ""}${writable ? form("training", `<div class="form-grid">${field("sessionAt", t("Session date & time", "تاريخ ووقت الجلسة"), { type: "datetime-local", max: localDateTime(), min: localDateTime(a.startsAt) })}${field("durationMinutes", t("Duration (minutes)", "المدة (بالدقائق)"), { type: "number", min: 1, max: 720, step: 1 })}</div>` + field("notes", t("Notes", "الملاحظات"), { type: "textarea", maxlength: 2000, placeholder: t("Performance, pace, and observations…", "الأداء والوتيرة والملاحظات…") }), t("Add Training Log", "إضافة سجل تدريب")) : a ? `<p class="notice">${t("This log is available to read. Only the assigned trainer can add sessions during an active agreement.", "هذا السجل متاح للقراءة. يمكن للمضمّر المسند إضافة الجلسات أثناء سريان الاتفاق فقط.")}</p>` : ""}`) : empty(t("No training agreements", "لا توجد اتفاقيات تدريب"))}<section class="section"><h2>${t("Recent Sessions", "الجلسات الأخيرة")}</h2><div class="section">${table(
    [
      t("Date", "التاريخ"),
      t("Camel", "الهجن"),
      t("Duration", "المدة"),
      t("Notes", "الملاحظات"),
    ],
    logs.map((l) => [
      datetime(l.sessionAt),
      link(`#${l.camelId}`, `#/camels/${l.camelId}`, "text-link"),
      `${l.durationMinutes} ${t("min", "دقيقة")}`,
      esc(l.notes),
    ]),
  )}</div></section></div>`;
}
