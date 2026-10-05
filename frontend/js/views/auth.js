import { api } from "../api.js";
import { config } from "../config.js";
import { state, t, setLanguage } from "../state.js";
import { navigate, safeNext } from "../router.js";
import { brand, field, form, link, toast, esc } from "../ui.js";

export async function authView(ctx) {
  const type = ctx.route.parts[0] || "signin";
  const signup = type === "signup",
    forgot = type === "forgot-password",
    reset = type === "reset-password";
  const title = signup
    ? t("Create Account", "إنشاء حساب")
    : forgot
      ? t("Forgot Password", "نسيت كلمة المرور")
      : reset
        ? t("Set a new password", "تعيين كلمة مرور جديدة")
        : t("Welcome Back", "مرحبًا بعودتك");
  const subtitle = signup
    ? t("Join our racing community", "انضم إلى مجتمع سباقات الهجن")
    : forgot
      ? t(
          "Enter your email and we will send you a recovery link.",
          "أدخل بريدك الإلكتروني لإرسال رابط الاستعادة.",
        )
      : reset
        ? t(
            "Choose a strong password for your account.",
            "اختر كلمة مرور قوية لحسابك.",
          )
        : t("Sign in to your account", "سجّل الدخول إلى حسابك");
  let fields = "";
  if (signup)
    fields += field("fullName", t("Full name", "الاسم الكامل"), {
      maxlength: 150,
      autocomplete: "name",
    });
  if (!reset)
    fields += field("email", t("Email address", "البريد الإلكتروني"), {
      type: "email",
      maxlength: 254,
      autocomplete: "email",
      placeholder: "you@example.com",
    });
  if (!forgot)
    fields += field("password", t("Password", "كلمة المرور"), {
      type: "password",
      autocomplete: signup || reset ? "new-password" : "current-password",
      minlength: signup || reset ? 12 : 1,
      maxlength: 72,
      hint:
        signup || reset
          ? t(
              "At least 12 characters; up to 72 UTF-8 bytes.",
              "12 حرفًا على الأقل، وبحد أقصى 72 بايت.",
            )
          : "",
    });
  if (signup || reset)
    fields += field(
      "confirmPassword",
      t("Confirm password", "تأكيد كلمة المرور"),
      { type: "password", autocomplete: "new-password" },
    );
  if (!signup && !forgot && !reset)
    fields += `<div class="forgot-row">${link(t("Forgot password?", "نسيت كلمة المرور؟"), "#/forgot-password", "text-link")}</div>`;
  const submit = signup
    ? t("Create Account", "إنشاء حساب")
    : forgot
      ? t("Send Recovery Link", "إرسال رابط الاستعادة")
      : reset
        ? t("Update Password", "تحديث كلمة المرور")
        : t("Sign In", "تسجيل الدخول");
  ctx.forms.auth = async (v) => {
    if (v.confirmPassword !== undefined && v.password !== v.confirmPassword)
      throw new Error(
        t("The passwords do not match.", "كلمتا المرور غير متطابقتين."),
      );
    if (v.password && new TextEncoder().encode(v.password).length > 72)
      throw new Error(
        t(
          "The password exceeds 72 UTF-8 bytes. Use a shorter password.",
          "كلمة المرور تتجاوز 72 بايت. استخدم كلمة مرور أقصر.",
        ),
      );
    if (forgot) {
      const result = await api.send("/api/auth/forgot-password", "POST", {
        email: v.email,
      });
      return { message: result.message, stay: true };
    }
    if (reset) {
      if (!state.resetToken)
        throw new Error(
          t(
            "Open the recovery link from your email first.",
            "افتح رابط الاستعادة الموجود في بريدك الإلكتروني أولًا.",
          ),
        );
      await api.send("/api/auth/reset-password", "POST", {
        token: state.resetToken,
        password: v.password,
      });
      state.resetToken = null;
      state.user = null;
      api.clearCsrf();
      toast(
        t(
          "Password updated. Sign in again.",
          "تم تحديث كلمة المرور. سجّل الدخول مجددًا.",
        ),
      );
      navigate("/signin");
      return;
    }
    if (signup) {
      await api.send("/api/auth/register", "POST", {
        fullName: v.fullName,
        email: v.email,
        password: v.password,
        preferredLanguage: state.language,
      });
      toast(
        t(
          "Account created. You can now sign in.",
          "تم إنشاء الحساب. يمكنك تسجيل الدخول الآن.",
        ),
      );
      navigate("/signin");
      return;
    }
    state.user = await api.request("/api/auth/login", {
      method: "POST",
      body: { email: v.email, password: v.password },
      quiet: true,
    });
    api.clearCsrf();
    await api.refreshCsrf();
    setLanguage(state.user.preferredLanguage);
    navigate(safeNext(ctx.route.params.get("next")));
  };
  return `<div class="container"><section class="auth-shell"><div class="auth-form">${brand()}<div class="auth-heading"><h1>${title}</h1><p>${subtitle}</p></div>${reset && !state.resetToken ? `<div class="notice">${t("Use a password reset link from your email, or request a new link.", "استخدم رابط الاستعادة من بريدك أو اطلب رابطًا جديدًا.")}</div>${link(t("Request a new link", "طلب رابط جديد"), "#/forgot-password")}` : form("auth", fields, submit)}${!forgot && !reset ? `<div class="divider">${t("or continue with", "أو تابع باستخدام")}</div>${config.googleEnabled ? `<a class="button google" href="${esc(config.apiBase)}/oauth2/authorization/google"><span class="google-mark" aria-hidden="true">G</span>${t("Continue with Google", "المتابعة باستخدام Google")}</a>` : `<button class="button google" disabled aria-describedby="google-help"><span class="google-mark" aria-hidden="true">G</span>${t("Continue with Google", "المتابعة باستخدام Google")}</button><p id="google-help" class="field-hint">${t("Google sign-in is not available yet.", "تسجيل الدخول عبر Google غير متاح بعد.")}</p>`}` : ""}<p class="auth-links">${signup ? `${t("Already a member?", "لديك حساب؟")} ${link(t("Sign in", "تسجيل الدخول"), "#/signin", "text-link")}` : forgot || reset ? link(t("← Back to Sign In", "العودة لتسجيل الدخول ←"), "#/signin", "text-link") : `${t("New to Gulf Racing?", "جديد في سباقات الخليج؟")} ${link(t("Create an account", "إنشاء حساب"), "#/signup", "text-link")}`}</p></div><div class="auth-side"><img src="assets/racing-hero.webp" alt="${t("Racing camels on an Omani desert track", "هجن السباق على مضمار رملي في عُمان")}"><div class="auth-quote"><p>${t("A proud heritage.<br>A shared passion.", "إرثٌ نفخر به.<br>وشغفٌ يجمعنا.")}</p><small>${t("WELCOME TO GULF RACING", "مرحبًا بك في سباقات الخليج")}</small></div></div></section></div>`;
}
