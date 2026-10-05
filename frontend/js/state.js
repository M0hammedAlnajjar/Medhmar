function preference() {
  try {
    return localStorage.getItem("gulf-language") === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}
export const state = { user: null, language: preference(), resetToken: null };
export const t = (english, arabic = english) =>
  state.language === "ar" ? arabic : english;
export const can = (...roles) =>
  Boolean(state.user?.roles?.some((role) => roles.includes(role)));
export function setLanguage(language) {
  state.language = language === "ar" ? "ar" : "en";
  try {
    localStorage.setItem("gulf-language", state.language);
  } catch {
    /* Private storage may be unavailable. */
  }
  document.documentElement.lang = state.language;
  document.documentElement.dir = state.language === "ar" ? "rtl" : "ltr";
}
