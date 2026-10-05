import { api, query } from "../api.js";
import { state, t } from "../state.js";
import { navigate } from "../router.js";
import {
  heading,
  panel,
  link,
  action,
  esc,
  badge,
  datetime,
  field,
  form,
  list,
  empty,
  image,
  pagination,
  toast,
} from "../ui.js";
export async function challenges(ctx) {
  const data = await ctx.get(
    "/api/challenges" +
      query({ page: ctx.route.params.get("page") || 0, size: 12 }),
  );
  return `<div class="container page">${heading(t("Camel Challenges", "تحديات الهجن"), t("Pick your favorite. Be part of the excitement.", "اختر المفضّل لديك وشارك الحماس."))}<div class="grid grid-3">${
    list(data).length
      ? list(data)
          .map((c) =>
            panel(
              `<div class="card-top"><h3>${esc(c.title)}</h3>${badge(c.status)}</div><p class="muted">${datetime(c.opensAt)} — ${datetime(c.closesAt)}</p><p class="meta-row">${c.totalVotes} ${t("votes", "تصويت")}</p><div class="section">${link(t("View Challenge", "عرض التحدي"), `#/challenges/${c.challengeId}`, "button secondary")}</div>`,
            ),
          )
          .join("")
      : empty(t("No challenges yet", "لا توجد تحديات بعد"))
  }</div>${pagination(data, ctx.route.params, "/challenges")}</div>`;
}
export async function challenge(ctx) {
  const c = await ctx.get(`/api/challenges/${ctx.id}`);
  const active =
    c.status === "OPEN" &&
    new Date(c.opensAt) <= new Date() &&
    new Date(c.closesAt) > new Date();
  const voted = state.votes?.has(`${state.user?.userId}:${ctx.id}`);
  for (const camel of c.camels)
    ctx.actions[`vote-${camel.camelId}`] = async () => {
      if (!state.user) {
        navigate(`/signin?next=${encodeURIComponent("/challenges/" + ctx.id)}`);
        return;
      }
      await api.send(`/api/challenges/${ctx.id}/votes`, "POST", {
        camelId: camel.camelId,
      });
      state.votes ??= new Set();
      state.votes.add(`${state.user.userId}:${ctx.id}`);
      toast(t("Your vote has been counted.", "تم احتساب تصويتك."));
      await ctx.reload();
    };
  return `<div class="container page compact">${link(t("← All challenges", "كل التحديات ←"), "#/challenges", "back-link")}${heading(t("Who will win?", "من سيفوز؟"), esc(c.title), badge(c.status))}<p class="muted">${datetime(c.opensAt)} — ${datetime(c.closesAt)}</p><div class="vote-grid section">${c.camels.map((camel, i) => `${i === 1 ? '<div class="versus" aria-hidden="true">VS</div>' : ""}<article class="card vote-card">${image(camel.photoUrl, camel.name, "card-image")}<div class="card-body"><h3>${esc(camel.name)}</h3><p class="muted">#${camel.camelId}</p><div class="vote-track" role="meter" aria-label="${esc(camel.name)} ${t("vote percentage", "نسبة التصويت")}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Number(camel.votePercent)}"><div style="width:${Math.min(100, Math.max(0, Number(camel.votePercent) || 0))}%"></div></div><strong>${Number(camel.votePercent).toFixed(1)}%</strong> <small class="muted">(${camel.voteCount})</small>${action(voted ? t("Vote Recorded", "تم التصويت") : t("Vote", "تصويت"), `vote-${camel.camelId}`, "button", active && !voted ? "" : "disabled")}</div></article>`).join("")}</div><p class="field-hint">${t("One vote per person. Votes cannot be changed.", "تصويت واحد لكل شخص، ولا يمكن تغييره.")}</p>${!active ? `<div class="notice">${t("Voting is outside its active window. You can still view the results.", "التصويت خارج الفترة المتاحة. يمكنك الاطلاع على النتائج.")}</div>` : ""}</div>`;
}
export async function assistant(ctx) {
  const status = await ctx.get("/api/ai/status");
  ctx.forms.chat = async (v, el) => {
    const history = document.querySelector("#chat-history");
    const reply = await api.send("/api/ai/chat", "POST", {
      question: v.question,
      language: state.language,
    });
    if (!el.isConnected) return;
    const user = document.createElement("div");
    user.className = "message user";
    user.textContent = v.question;
    history.append(user);
    const response = document.createElement("div");
    response.className = "message";
    response.dir = reply.language === "ar" ? "rtl" : "ltr";
    const label = document.createElement("small");
    label.textContent = t("Gulf Racing Assistant", "مساعد سباقات الخليج");
    response.append(label, document.createTextNode(reply.answer));
    if (reply.sources?.length) {
      const sources = document.createElement("div");
      sources.className = "source-list";
      sources.textContent =
        t("Sources: ", "المصادر: ") +
        reply.sources.map((s) => s.label).join(" · ");
      response.append(sources);
    }
    history.append(response);
    history.scrollTop = history.scrollHeight;
    el.elements.question.value = "";
    el.elements.question.focus();
  };
  return `<div class="container page chat-layout">${heading(t("Your Racing Assistant", "مساعدك لسباقات الهجن"), t("Guidance grounded in Gulf Racing’s rules and your permissions.", "إرشادات وفق قواعد سباقات الخليج وصلاحياتك."))}${panel(`<div class="inline"><img src="assets/mark.svg" alt="" width="35"><strong>${t("Gulf Racing Assistant", "مساعد سباقات الخليج")}</strong>${badge(status.available ? "ACTIVE" : "INACTIVE")}</div>${!status.available ? `<div class="notice">${t("The assistant is not available at the moment. Please try again later.", "المساعد غير متاح حاليًا. يرجى المحاولة لاحقًا.")}</div>` : ""}<div id="chat-history" class="chat-history" role="log" aria-live="polite" aria-label="${t("Conversation", "المحادثة")}"><div class="message">${t("Welcome. Ask me about race registration, camel profiles, partnerships or the platform’s rules.", "مرحبًا. اسألني عن التسجيل في السباقات أو ملفات الهجن أو الشراكات أو قواعد المنصة.")}</div></div>${status.available ? form("chat", field("question", t("Your question", "سؤالك"), { type: "textarea", maxlength: Math.min(status.maxQuestionLength || 2000, 2000), placeholder: t("How do I register my camel for a race?", "كيف أسجّل الهجن في سباق؟") }), t("Send Question", "إرسال السؤال")) : ""}`)}</div>`;
}
