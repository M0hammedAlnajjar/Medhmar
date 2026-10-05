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
  money,
  field,
  form,
  list,
  table,
  empty,
  image,
  pagination,
  camelOptions,
  toast,
} from "../ui.js";
export async function marketplace(ctx) {
  const mine = ctx.route.path === "/my-listings",
    p = ctx.route.params;
  const data = await ctx.get(
    mine
      ? "/marketplace/my-listings"
      : "/marketplace/getAll" +
          query({
            page: p.get("page") || 0,
            size: 12,
            status: "AVAILABLE",
            search: p.get("search"),
            minPrice: p.get("minPrice"),
            maxPrice: p.get("maxPrice"),
          }),
  );
  const listings = list(data);
  const camels = await Promise.all(
    listings.map((l) => ctx.get(`/camel/getById?id=${l.camelId}`)),
  );
  ctx.forms.filter = (v) => {
    if (v.minPrice && v.maxPrice && Number(v.minPrice) > Number(v.maxPrice))
      throw new Error(
        t(
          "Minimum price cannot exceed maximum price.",
          "الحد الأدنى للسعر أكبر من الحد الأقصى.",
        ),
      );
    navigate(`/marketplace${query(v)}`);
  };
  return `<div class="container page">${heading(mine ? t("My Sale Listings", "إعلانات البيع الخاصة بي") : t("Camel Marketplace", "سوق الهجن"), t("A new chapter starts with the right camel.", "تبدأ رحلة جديدة باختيار الهجن المناسب."), can("OWNER", "ADMIN") ? link(`${icon("plus")}${t("Create Listing", "إنشاء إعلان")}`, "#/marketplace/new") : "")}<div class="actions">${state.user ? link(t("My Offers", "عروضي"), "#/offers", "text-link") : ""}${can("OWNER", "ADMIN") ? link(mine ? t("Browse marketplace", "تصفّح السوق") : t("My listings", "إعلاناتي"), mine ? "#/marketplace" : "#/my-listings", "text-link") : ""}</div>${mine ? "" : `<form data-form="filter" class="filters"><div class="form-errors" role="alert"></div>${field("search", t("Search", "بحث"), { required: false, value: p.get("search") || "", placeholder: t("Search listings", "ابحث في الإعلانات") })}${field("minPrice", t("Min. price (OMR)", "أدنى سعر (ر.ع.)"), { type: "number", required: false, min: 0, step: ".001", value: p.get("minPrice") || "" })}${field("maxPrice", t("Max. price (OMR)", "أقصى سعر (ر.ع.)"), { type: "number", required: false, min: 0, step: ".001", value: p.get("maxPrice") || "" })}<button class="button">${t("Search", "بحث")}</button></form>`}<div class="grid grid-3 section">${listings.length ? listings.map((l, i) => `<article class="card">${image(camels[i].photoUrl, camels[i].name, "card-image")}<div class="card-body"><div class="card-top"><h3>${esc(camels[i].name)}</h3>${badge(l.status)}</div><p class="muted">${esc(camels[i].breed)} · ${esc(camels[i].gender)}</p><strong>${money(l.askingPriceOmr)}</strong><div>${link(t("View Listing", "عرض الإعلان"), `#/marketplace/${l.listingId}`, "button secondary small")}</div></div></article>`).join("") : empty(t("No listings found", "لا توجد إعلانات مطابقة"))}</div>${mine ? "" : pagination(data, p, "/marketplace")}</div>`;
}
export async function listingDetail(ctx) {
  const l = await ctx.get(`/marketplace/getById?id=${ctx.id}`),
    c = await ctx.get(`/camel/getById?id=${l.camelId}`);
  const seller = state.user?.userId === l.userId;
  const offers = seller ? await ctx.get(`/offer/listing/${ctx.id}`) : [];
  ctx.forms.offer = async (v) => {
    await api.send("/offer/add", "POST", {
      listingId: ctx.id,
      offeredPriceOmr: Number(v.offeredPriceOmr),
    });
    toast(t("Your offer was submitted.", "تم إرسال عرضك."));
    navigate("/offers");
  };
  ctx.actions["cancel-listing"] = async () => {
    if (!confirm(t("Cancel this sale listing?", "هل تريد إلغاء إعلان البيع؟")))
      return;
    await api.send(`/marketplace/deleteById?id=${ctx.id}`, "DELETE");
    toast(t("Listing cancelled.", "تم إلغاء الإعلان."));
    await ctx.reload();
  };
  return `<div class="container page">${link(t("← Marketplace", "السوق ←"), "#/marketplace", "back-link")}${heading(esc(c.name), t("Listing details", "تفاصيل الإعلان"), badge(l.status))}<div class="detail-grid">${image(c.photoUrl, c.name, "detail-photo")}<section>${panel(`<p class="eyebrow">${t("ASKING PRICE", "السعر المطلوب")}</p><h2>${money(l.askingPriceOmr)}</h2><p class="muted">${esc(l.description)}</p><p class="meta-row">${esc(c.breed)} · ${esc(c.gender)} · ${date(c.birthDate)}</p><div class="actions section">${link(t("Camel Profile & History", "ملف الهجن وتاريخه"), `#/camels/${c.camelId}`, "button secondary")}</div>`)}<div class="section">${seller ? `${link(t("Edit Listing", "تعديل الإعلان"), `#/marketplace/${ctx.id}/edit`, "button secondary")} ${l.status === "AVAILABLE" ? action(t("Cancel Listing", "إلغاء الإعلان"), "cancel-listing", "button danger") : ""}` : l.status !== "AVAILABLE" ? empty(t("This listing is no longer available", "هذا الإعلان غير متاح الآن")) : state.user ? panel(`<h3>${t("Make an Offer", "قدّم عرضًا")}</h3>${form("offer", field("offeredPriceOmr", t("Your offer (OMR)", "عرضك (ر.ع.)"), { type: "number", min: ".001", step: ".001" }), t("Submit Offer", "إرسال العرض"))}`) : link(t("Sign in to make an offer", "سجّل الدخول لتقديم عرض"), `#/signin?next=${encodeURIComponent("/marketplace/" + ctx.id)}`)}</div></section></div>${seller ? `<section class="section"><h2>${t("Buyer Offers", "عروض المشترين")}</h2><div class="section">${offerTable(offers)}</div></section>` : ""}</div>`;
}
export async function listingForm(ctx) {
  const edit = Boolean(ctx.id),
    l = edit ? await ctx.get(`/marketplace/getById?id=${ctx.id}`) : {};
  const camels = await ctx.get("/camel/my-camels");
  ctx.forms.listing = async (v) => {
    const payload = {
      askingPriceOmr: Number(v.askingPriceOmr),
      description: v.description,
    };
    if (edit) payload.listingId = ctx.id;
    else payload.camelId = Number(v.camelId);
    const result = await api.send(
      edit ? "/marketplace/update" : "/marketplace/add",
      edit ? "PUT" : "POST",
      payload,
    );
    toast(t("Listing saved.", "تم حفظ الإعلان."));
    navigate(`/marketplace/${edit ? ctx.id : result}`);
  };
  return `<div class="container page compact">${heading(edit ? t("Edit Sale Listing", "تعديل إعلان البيع") : t("Create Sale Listing", "إنشاء إعلان بيع"))}${panel(form("listing", (edit ? "" : field("camelId", t("Select camel", "اختيار الهجن"), { options: camelOptions(camels.filter((c) => c.status === "ACTIVE")) })) + field("askingPriceOmr", t("Asking price (OMR)", "السعر المطلوب (ر.ع.)"), { type: "number", min: ".001", step: ".001", value: l.askingPriceOmr || "" }) + field("description", t("Description", "الوصف"), { type: "textarea", minlength: 3, maxlength: 255, value: l.description || "" }), t("Save Listing", "حفظ الإعلان")))}</div>`;
}
function offerTable(offers) {
  return table(
    [
      t("Offer", "العرض"),
      t("Listing", "الإعلان"),
      t("Amount", "القيمة"),
      t("Status", "الحالة"),
      t("Details", "التفاصيل"),
    ],
    offers.map((o) => [
      `#${o.offerId}`,
      link(`#${o.listingId}`, `#/marketplace/${o.listingId}`, "text-link"),
      money(o.offeredPriceOmr),
      badge(o.status),
      link(
        t("Review", "مراجعة"),
        `#/offers/${o.offerId}`,
        "button secondary small",
      ),
    ]),
  );
}
export async function offers(ctx) {
  return `<div class="container page">${heading(t("My Offers", "عروضي"), t("Review offers you have sent or received.", "راجع العروض التي أرسلتها أو استلمتها."))}${offerTable(await ctx.get("/offer/getAll"))}</div>`;
}
export async function offerDetail(ctx) {
  const o = await ctx.get(`/offer/getById?id=${ctx.id}`),
    l = await ctx.get(`/marketplace/getById?id=${o.listingId}`),
    c = await ctx.get(`/camel/getById?id=${l.camelId}`);
  const seller = state.user.userId === l.userId,
    buyer = state.user.userId === o.userId;
  ctx.actions.accept = async () => {
    if (
      !confirm(
        t(
          `Accept ${money(o.offeredPriceOmr)} for ${c.name}? This transfers ownership to the buyer and closes the listing.`,
          `قبول ${money(o.offeredPriceOmr)} مقابل ${c.name}؟ سيُنقل ملك الهجن إلى المشتري ويُغلق الإعلان.`,
        ),
      )
    )
      return;
    await api.send(`/offer/${ctx.id}/accept`);
    toast(
      t("Offer accepted. Ownership updated.", "تم قبول العرض وتحديث الملكية."),
    );
    await ctx.reload();
  };
  ctx.actions.decline = async () => {
    if (!confirm(t("Decline this offer?", "هل تريد رفض العرض؟"))) return;
    await api.send(`/offer/${ctx.id}/decline`);
    toast(t("Offer declined.", "تم رفض العرض."));
    await ctx.reload();
  };
  ctx.actions.withdraw = async () => {
    if (!confirm(t("Withdraw your offer?", "هل تريد سحب عرضك؟"))) return;
    await api.send(`/offer/deleteById?id=${ctx.id}`, "DELETE");
    toast(t("Offer withdrawn.", "تم سحب العرض."));
    navigate("/offers");
  };
  return `<div class="container page">${link(t("← My offers", "عروضي ←"), "#/offers", "back-link")}${heading(t("Buyer Offer", "عرض المشتري"), `${esc(c.name)} · #${o.offerId}`)}<div class="detail-grid">${image(c.photoUrl, c.name, "detail-photo")}${panel(`<h2>${t("Offer Details", "تفاصيل العرض")}</h2><dl class="profile-meta"><div><dt>${t("Buyer", "المشتري")}</dt><dd>#${o.userId}</dd></div><div><dt>${t("Offer price", "قيمة العرض")}</dt><dd>${money(o.offeredPriceOmr)}</dd></div><div><dt>${t("Date", "التاريخ")}</dt><dd>${date(o.createdAt)}</dd></div><div><dt>${t("Status", "الحالة")}</dt><dd>${badge(o.status)}</dd></div></dl><div class="actions">${seller && o.status === "PENDING" && l.status === "AVAILABLE" ? action(t("Accept Offer", "قبول العرض"), "accept", "button") + action(t("Decline", "رفض"), "decline", "button secondary") : ""}${buyer && o.status === "PENDING" ? action(t("Withdraw Offer", "سحب العرض"), "withdraw", "button danger") : ""}${link(t("View Listing", "عرض الإعلان"), `#/marketplace/${l.listingId}`, "text-link")}</div>${seller && o.status === "PENDING" ? `<p class="notice">${t("Accepting this offer transfers ownership. Review the amount and agreement terms before confirming.", "قبول العرض ينقل الملكية. راجع القيمة وشروط الاتفاق قبل التأكيد.")}</p>` : ""}`)}</div></div>`;
}
