import { api } from "../api.js";
import { state, t, can, setLanguage } from "../state.js";
import { navigate } from "../router.js";
import {
  icon,
  heading,
  panel,
  link,
  action,
  esc,
  date,
  field,
  form,
  list,
  empty,
  image,
  toast,
} from "../ui.js";
import { raceRow } from "./races.js";
export async function home(ctx) {
  const races = list(await ctx.get("/api/races?status=OPEN&size=4"));
  const quick = [
    [
      "calendar",
      t("Race Schedule", "جدول السباقات"),
      t("Your upcoming races", "تصفّح السباقات القادمة"),
      "/races",
    ],
    [
      "book",
      t("My Registrations", "تسجيلاتي"),
      t("Follow your entries", "تابع مشاركاتك"),
      "/registrations",
    ],
  ];
  if (can("OWNER", "ADMIN"))
    quick.push([
      "cup",
      t("My Camels", "الهجن الخاصة بي"),
      t("Manage your camels", "إدارة ملفات الهجن"),
      "/my-camels",
    ]);
  if (can("OWNER", "TRAINER", "ADMIN"))
    quick.push([
      "book",
      t("My Agreements", "اتفاقياتي"),
      t("Partnerships with Mudammers", "شراكات التدريب"),
      "/agreements",
    ]);
  quick.push([
    "bag",
    t("Marketplace", "السوق"),
    t("Explore camels for sale", "تصفّح الهجن المعروضة للبيع"),
    "/marketplace",
  ]);
  if (can("TRAINER"))
    quick.push([
      "clock",
      t("Assigned Camels", "الهجن المسندة"),
      t("Your training companions", "الهجن التي تدرّبها"),
      "/assigned",
    ]);
  if (can("ORGANIZER", "ADMIN"))
    quick.push([
      "calendar",
      t("Organizer Dashboard", "لوحة المنظّم"),
      t("Manage races and entries", "إدارة السباقات والمشاركات"),
      "/organizer",
    ]);
  return `<div class="container page"><section class="welcome"><img src="assets/racing-hero.webp" alt=""><div class="welcome-content"><p class="eyebrow">${t("WELCOME TO YOUR RACING COMMUNITY", "مرحبًا بك في مجتمع السباقات")}</p><h1>${esc(state.user.fullName)}</h1><p class="muted">${t("Member since", "عضو منذ")} ${date(state.user.joinedAt)}</p></div></section><section class="grid grid-2 section">${quick.map(([ico, title, desc, path]) => `<a class="quick-link" href="#${path}">${icon(ico)}<div><h3>${title}</h3><p>${desc}</p></div></a>`).join("")}</section><section class="section"><div class="section-heading"><h2>${t("Upcoming Races", "السباقات القادمة")}</h2>${link(t("View all", "عرض الكل"), "#/races", "text-link")}</div>${races.length ? races.map(raceRow).join("") : empty(t("No open races yet", "لا توجد سباقات مفتوحة بعد"))}</section></div>`;
}
export async function settings(ctx) {
  const u = state.user;
  ctx.forms.profile = async (v) => {
    const updated = await api.send("/api/users/me", "PUT", {
      fullName: v.fullName,
      preferredLanguage: v.preferredLanguage,
      avatarUrl: v.avatarUrl || null,
    });
    state.user = updated;
    setLanguage(updated.preferredLanguage);
    toast(t("Profile updated.", "تم تحديث الملف."));
    await ctx.reload();
  };
  return `<div class="container page">${heading(t("Settings", "الإعدادات"), t("Make Gulf Racing your own.", "عدّل حسابك وتفضيلاتك."))}<div class="split"><nav class="settings-nav" aria-label="${t("Settings", "الإعدادات")}"><a href="#/settings" aria-current="page">${icon("user")}${t("Profile & Language", "الملف واللغة")}</a>${can("TRAINER") ? `<a href="#/trainer-profile">${icon("book")}${t("Trainer Profile", "ملف المضمّر")}</a>` : ""}<button data-action="signout" class="danger">${icon("lock")}${t("Sign Out", "تسجيل الخروج")}</button></nav>${panel(
    `<h2>${t("Your Profile", "ملفك الشخصي")}</h2>${form(
      "profile",
      field("fullName", t("Full name", "الاسم الكامل"), {
        value: u.fullName,
        maxlength: 150,
        autocomplete: "name",
      }) +
        field("email", t("Email address", "البريد الإلكتروني"), {
          type: "email",
          value: u.email,
          readonly: "readonly",
          hint: t(
            "Email changes are not available through profile settings.",
            "لا يتاح تغيير البريد الإلكتروني من إعدادات الملف.",
          ),
        }) +
        field("avatarUrl", t("Profile photo URL", "رابط صورة الملف"), {
          type: "url",
          value: u.avatarUrl || "",
          required: false,
          maxlength: 2048,
        }) +
        field("preferredLanguage", t("Language", "اللغة"), {
          value: state.language,
          options: [
            ["en", "English"],
            ["ar", "العربية"],
          ],
        }) +
        `<p class="field-hint">${t("Roles", "الأدوار")}: ${u.roles.map(esc).join(", ")}</p>`,
    )}`,
  )}</div></div>`;
}
export async function trainerProfile(ctx) {
  let profile;
  try {
    profile = await ctx.get(`/trainer-profile/getById?id=${state.user.userId}`);
  } catch (e) {
    if (e.status !== 404) throw e;
  }
  ctx.forms.trainer = async (v) => {
    await api.send(
      profile ? "/trainer-profile/update" : "/trainer-profile/add",
      profile ? "PUT" : "POST",
      { bio: v.bio, location: v.location },
    );
    toast(t("Trainer profile saved.", "تم حفظ ملف المضمّر."));
    await ctx.reload();
  };
  return `<div class="container page compact">${heading(t("Trainer Profile", "ملف المضمّر"), t("Help camel owners get to know your work.", "عرّف أصحاب الهجن على خبرتك."))}${panel(form("trainer", field("location", t("Location", "الموقع"), { value: profile?.location || "", maxlength: 150 }) + field("bio", t("About your training", "نبذة عن التدريب"), { type: "textarea", value: profile?.bio || "", maxlength: 2000 }), t("Save Profile", "حفظ الملف")))}</div>`;
}
