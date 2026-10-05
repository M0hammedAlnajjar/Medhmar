import { api, query } from "../api.js";
import { state, t, can } from "../state.js";
import { navigate } from "../router.js";
import {
  icon,
  heading,
  panel,
  link,
  action,
  esc,
  badge,
  date,
  datetime,
  field,
  form,
  list,
  table,
  empty,
  errorPanel,
  pagination,
  camelOptions,
  image,
  localDateTime,
  toast,
  number,
} from "../ui.js";

export function raceRow(race) {
  return `<a class="race-row" href="#/races/${race.raceId}"><img class="race-thumb" src="assets/racing-hero.webp" alt="" loading="lazy"><div><h3>${esc(race.name)}</h3><p>${esc(race.location)} &nbsp;·&nbsp; ${date(race.startsAt)} &nbsp;·&nbsp; ${esc(race.distanceKm)} km</p></div><div class="inline">${badge(race.status)}${icon("arrow")}</div></a>`;
}
export async function landing(ctx) {
  ctx.mounted = async () => {
    const target = document.querySelector("#upcoming-races");
    try {
      const upcoming = list(await ctx.get("/api/races?status=OPEN&size=3"));
      if (!target?.isConnected || ctx.signal.aborted) return;
      target.innerHTML = upcoming.length
        ? upcoming.map(raceRow).join("")
        : empty(
            t("The next race is on its way", "السباق القادم في الطريق"),
            t(
              "Published open races will appear here. Explore the schedule for more.",
              "ستظهر السباقات المفتوحة هنا عند نشرها.",
            ),
          );
    } catch (error) {
      if (!ctx.signal.aborted && target?.isConnected)
        target.innerHTML = errorPanel(error);
    } finally {
      target?.removeAttribute("aria-busy");
    }
  };
  return `<section class="hero"><img class="hero-photo" src="assets/racing-hero.webp" alt="${t("Camels racing through the golden sands of Oman", "هجن تتسابق على رمال عُمان الذهبية")}" fetchpriority="high"><div class="container hero-content"><p class="eyebrow">${t("ROOTED IN TRADITION. DRIVEN BY PASSION.", "أصالةٌ راسخة. وشغفٌ متجدد.")}</p><h1>${t("Racing<br>our <em>heritage.</em>", "نتسابق<br>بروح <em>تراثنا.</em>")}</h1><p class="tagline">${t("FOR A BRIGHTER TOMORROW", "نحو غدٍ أكثر إشراقًا")}</p>${link(`${t("Explore Races", "استكشف السباقات")} ${icon("arrow")}`, "#/races")}</div><span class="hero-caption">${t("THE SPIRIT OF THE DESERT", "روح الصحراء")}</span></section><div class="location-strip"><div class="container locations">${["Muscat", "Barka", "Adam"].map((city, i) => `<a href="#/races?search=${city}">${icon("pin")}${t(city, ["مسقط", "بركاء", "أدم"][i])}</a>`).join("")}</div></div><div class="container landing-content"><section><div class="section-heading"><div><p class="eyebrow">${t("MEET AT THE STARTING LINE", "نلتقي عند خط البداية")}</p><h2>${t("The next chapter awaits", "الفصل القادم ينتظرك")}</h2></div>${link(`${t("All races", "كل السباقات")} ${icon("arrow")}`, "#/races", "text-link")}</div><div id="upcoming-races" aria-busy="true"><div class="skeleton" role="status" aria-label="${t("Loading races", "جارٍ تحميل السباقات")}"></div></div></section><section class="section grid grid-3">${[
    [
      t("Follow every race", "تابع كل سباق"),
      t(
        "Schedules, participants and official results, together.",
        "المواعيد والمشاركون والنتائج الرسمية في مكان واحد.",
      ),
      "cup",
      "/races",
    ],
    [
      t("Know your camels", "تعرّف على الهجن"),
      t(
        "Profiles, pedigree and a history worth preserving.",
        "ملفات الهجن وأنسابها وتاريخ يستحق الحفاظ عليه.",
      ),
      "book",
      "/camels",
    ],
    [
      t("Connect with the community", "تواصل مع المجتمع"),
      t(
        "Find a Mudammer and build your next partnership.",
        "ابحث عن مضمّر وابدأ شراكتك القادمة.",
      ),
      "user",
      "/trainers",
    ],
  ]
    .map(
      ([title, text, ico, path]) =>
        `<a class="feature-item" href="#${path}">${icon(ico)}<div><h3>${title}</h3><p>${text}</p></div></a>`,
    )
    .join("")}</section></div>`;
}
function calendar(races, month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1),
    days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const today = new Date();
  const eventDays = new Set(
    races
      .map((r) => new Date(r.startsAt))
      .filter(
        (d) =>
          d.getMonth() === month.getMonth() &&
          d.getFullYear() === month.getFullYear(),
      )
      .map((d) => d.getDate()),
  );
  const labels = t(
    ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
    ["ح", "ن", "ث", "ر", "خ", "ج", "س"],
  );
  return `<div class="calendar panel"><div class="calendar-top"><h2>${new Intl.DateTimeFormat(state.language === "ar" ? "ar-OM" : "en-GB", { month: "long", year: "numeric" }).format(month)}</h2><div>${action("‹", "month-prev", "", `aria-label="${t("Previous month", "الشهر السابق")}"`)}${action("›", "month-next", "", `aria-label="${t("Next month", "الشهر التالي")}"`)}</div></div><div class="calendar-grid">${labels.map((l) => `<span class="day-label">${l}</span>`).join("")}${"<span></span>".repeat(first.getDay())}${Array.from({ length: days }, (_, i) => `<span class="${eventDays.has(i + 1) ? "has-race" : ""} ${today.getDate() === i + 1 && today.getMonth() === month.getMonth() && today.getFullYear() === month.getFullYear() ? "today" : ""}">${i + 1}</span>`).join("")}</div><p class="field-hint">${t("Highlighted dates show races on this page.", "التواريخ المظللة لسباقات هذه الصفحة.")}</p></div>`;
}
export async function races(ctx) {
  const archive = ctx.route.path === "/archive";
  const params = ctx.route.params;
  const status = archive ? "COMPLETED" : params.get("status") || "";
  const data = await ctx.get(
    "/api/races" +
      query({
        page: params.get("page") || 0,
        size: 10,
        search: params.get("search"),
        status,
      }),
  );
  const rows = list(data);
  ctx.forms.filter = (v) =>
    navigate(`${archive ? "/archive" : "/races"}${query(v)}`);
  const monthParam = Number(params.get("month") || 0);
  const month = new Date();
  month.setDate(1);
  month.setMonth(month.getMonth() + monthParam);
  const changeMonth = (n) => {
    const next = new URLSearchParams(params);
    next.set("month", monthParam + n);
    navigate(`${ctx.route.path}?${next}`);
  };
  ctx.actions["month-prev"] = () => changeMonth(-1);
  ctx.actions["month-next"] = () => changeMonth(1);
  return `<div class="container page">${heading(archive ? t("Race Archive", "أرشيف السباقات") : t("Race Schedule", "جدول السباقات"), t("Every race. Every moment. Part of our heritage.", "كل سباق، وكل لحظة، جزء من تراثنا."), link(archive ? t("Upcoming races", "السباقات القادمة") : t("Past races", "السباقات السابقة"), archive ? "#/races" : "#/archive", "button secondary"))}<form data-form="filter" class="filters"><div class="form-errors" role="alert"></div>${field("search", t("Search races", "البحث في السباقات"), { required: false, value: params.get("search") || "", placeholder: t("Race name or location", "اسم السباق أو الموقع") })}${
    !archive
      ? field("status", t("Status", "الحالة"), {
          required: false,
          value: status,
          options: [
            ["", t("All races", "كل السباقات")],
            ["SCHEDULED", t("Scheduled", "مجدولة")],
            ["OPEN", t("Registration open", "التسجيل مفتوح")],
            ["CLOSED", t("Registration closed", "التسجيل مغلق")],
            ["COMPLETED", t("Completed", "مكتملة")],
            ["CANCELLED", t("Cancelled", "ملغاة")],
          ],
        })
      : ""
  }<button class="button" type="submit">${icon("search")}${t("Search", "بحث")}</button></form><div class="${archive ? "" : "split"}">${archive ? "" : calendar(rows, month)}<section>${rows.length ? rows.map(raceRow).join("") : empty(t("No matching races", "لا توجد سباقات مطابقة"), t("Try another location or status.", "جرّب موقعًا أو حالة أخرى."))}${pagination(data, params, ctx.route.path)}</section></div></div>`;
}
export async function raceDetail(ctx) {
  const id = ctx.id;
  const r = await ctx.get(`/api/races/${id}`);
  const manager =
    state.user &&
    (can("ADMIN") || (can("ORGANIZER") && state.user.userId === r.organizerId));
  return `<div class="container page">${link(t("← Race schedule", "جدول السباقات ←"), "#/races", "back-link")}<img class="race-banner" src="assets/racing-hero.webp" alt="${t("Camel racing in Oman", "سباقات الهجن في عُمان")}"><div class="section">${heading(esc(r.name), badge(r.status), manager ? link(t("Manage race", "إدارة السباق"), `#/organizer/races/${id}`, "button secondary") : "")}<div class="race-info"><div>${icon("pin")}<div><small>${t("Location", "الموقع")}</small><strong>${esc(r.location)}</strong></div></div><div>${icon("calendar")}<div><small>${t("Date & time", "التاريخ والوقت")}</small><strong>${datetime(r.startsAt)}</strong></div></div><div>${icon("cup")}<div><small>${t("Distance", "المسافة")}</small><strong>${esc(r.distanceKm)} km</strong></div></div></div><div class="actions">${link(t("View Participants", "عرض المشاركين"), `#/races/${id}/participants`)}${link(t("Official Results", "النتائج الرسمية"), `#/races/${id}/results`, "button secondary")}${r.status === "OPEN" && new Date(r.startsAt) > new Date() ? link(t("Register a Camel", "تسجيل هجن"), `#/races/${id}/register`, "button secondary") : ""}</div></div></div>`;
}
export async function participants(ctx) {
  const race = await ctx.get(`/api/races/${ctx.id}`);
  let card;
  try {
    card = await ctx.get(`/api/race-cards/races/${ctx.id}/latest`);
  } catch (e) {
    if (e.status !== 404) throw e;
  }
  return `<div class="container page">${link(esc(race.name), `#/races/${ctx.id}`, "back-link")}${heading(t("Participants", "المشاركون"), `${esc(race.name)} · ${date(race.startsAt)} · ${race.distanceKm} km`)}${
    card
      ? table(
          [
            t("Number", "الرقم"),
            t("Camel name", "اسم الهجن"),
            t("Owner", "المالك"),
            t("Mudammer", "المضمّر"),
          ],
          card.entries.map((e) => [
            esc(e.participantNumber),
            link(esc(e.camelName), `#/camels/${e.camelId}`, "text-link"),
            esc(e.ownerName),
            esc(e.trainerName) || "—",
          ]),
        ) +
        `<p class="field-hint">${t("Published race card", "بطاقة السباق المنشورة")} · ${t("Version", "الإصدار")} ${card.version} · ${date(card.publishDate)}</p>`
      : empty(
          t(
            "Participants have not been published yet",
            "لم تُنشر قائمة المشاركين بعد",
          ),
          t(
            "The organizer publishes the official race card after approving entries.",
            "ينشر المنظّم بطاقة السباق الرسمية بعد قبول المشاركات.",
          ),
        )
  }</div>`;
}
export async function raceResults(ctx) {
  const r = await ctx.get(`/api/races/${ctx.id}`);
  ctx.actions.print = () => window.print();
  return `<div class="container page">${link(esc(r.name), `#/races/${ctx.id}`, "back-link")}${heading(t("Official Results", "النتائج الرسمية"), esc(r.name), r.resultsImageUrl ? action(t("Print results", "طباعة النتائج"), "print") : "")}<div class="results-sheet"><h2>${esc(r.name)}</h2><p class="eyebrow">${t("OFFICIAL RACE RESULTS", "النتائج الرسمية للسباق")}</p>${r.resultsImageUrl ? image(r.resultsImageUrl, t("Official published race results", "النتائج الرسمية المنشورة للسباق"), "results-image") : empty(t("Results are not published yet", "لم تُنشر النتائج بعد"), t("The official results image will appear here once published by the organizer.", "ستظهر صورة النتائج الرسمية هنا بعد نشرها من المنظّم."))}</div></div>`;
}
export async function registration(ctx) {
  const [race, camels] = await Promise.all([
    ctx.get(`/api/races/${ctx.id}`),
    ctx.get("/camel/my-camels"),
  ]);
  ctx.forms.registration = async (v) => {
    await api.send("/api/race-entries", "POST", {
      raceId: ctx.id,
      camelId: Number(v.camelId),
    });
    toast(
      t("Registration submitted for approval.", "تم إرسال التسجيل للموافقة."),
    );
    navigate("/registrations");
  };
  return `<div class="container page compact">${heading(t("Register a Camel", "تسجيل هجن"), esc(race.name))}${race.status !== "OPEN" || new Date(race.startsAt) <= new Date() ? empty(t("Registration is closed", "التسجيل مغلق")) : panel(form("registration", field("camelId", t("Your camel", "الهجن الخاصة بك"), { options: camelOptions(camels.filter((c) => c.status === "ACTIVE")) }) + `<p class="muted">${t("The organizer reviews each entry. You can withdraw a pending registration before a decision.", "يراجع المنظّم كل مشاركة. يمكنك سحب التسجيل المعلّق قبل اتخاذ القرار.")}</p>`, t("Submit Registration", "إرسال التسجيل")))}</div>`;
}
export async function registrations(ctx) {
  const entries = await ctx.get("/api/race-entries/mine");
  for (const e of entries)
    ctx.actions[`withdraw-${e.entryId}`] = async () => {
      if (
        !confirm(
          t(
            "Withdraw this pending registration?",
            "هل تريد سحب هذا التسجيل المعلّق؟",
          ),
        )
      )
        return;
      await api.send(`/api/race-entries/${e.entryId}`, "DELETE");
      toast(t("Registration withdrawn.", "تم سحب التسجيل."));
      await ctx.reload();
    };
  return `<div class="container page">${heading(t("My Registrations", "تسجيلاتي"), "", link(t("Explore races", "استكشف السباقات"), "#/races"))}${table(
    [
      t("Race", "السباق"),
      t("Camel", "الهجن"),
      t("Number", "الرقم"),
      t("Status", "الحالة"),
      t("Action", "الإجراء"),
    ],
    entries.map((e) => [
      link(`#${e.raceId}`, `#/races/${e.raceId}`, "text-link"),
      link(`#${e.camelId}`, `#/camels/${e.camelId}`, "text-link"),
      e.participantNumber,
      badge(e.entryStatus),
      e.entryStatus === "PENDING"
        ? action(
            t("Withdraw", "سحب"),
            `withdraw-${e.entryId}`,
            "button danger small",
          )
        : "—",
    ]),
  )}</div>`;
}
