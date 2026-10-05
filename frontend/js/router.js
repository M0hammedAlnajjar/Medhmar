export function currentRoute(hash = location.hash) {
  const raw = hash.startsWith("#/") ? hash.slice(1) : "/";
  const [path, search = ""] = raw.split("?");
  return {
    path: path.replace(/\/$/, "") || "/",
    params: new URLSearchParams(search),
    parts: path.split("/").filter(Boolean),
  };
}
export function navigate(path) {
  location.hash = path.startsWith("/") ? path : `/${path}`;
}
export function safeNext(path) {
  return /^\/(?!\/)[a-zA-Z0-9/?=&%_-]*$/.test(path || "") &&
    !path.startsWith("/signin")
    ? path
    : "/home";
}
