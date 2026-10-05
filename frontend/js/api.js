import { config } from "./config.js";

export class ApiError extends Error {
  constructor(message, status = 0, fields = {}, code = "") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
    this.code = code;
  }
}

export function query(values = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== "" && value !== null && value !== undefined)
      params.set(key, String(value));
  }
  return params.size ? `?${params}` : "";
}

export function createApi({
  base = config.apiBase,
  fetcher = (...args) => fetch(...args),
  timeout = config.requestTimeoutMs,
} = {}) {
  let csrf = null;
  let pendingCsrf = null;
  async function request(
    path,
    { method = "GET", body, signal, quiet = false } = {},
  ) {
    if (!path.startsWith("/") || path.startsWith("//"))
      throw new Error("Invalid API path");
    const writes = !["GET", "HEAD"].includes(method);
    if (writes && !csrf) await refreshCsrf();
    const headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (writes) headers[csrf.headerName] = csrf.token;
    const controller = new AbortController();
    const abort = () => controller.abort(signal.reason);
    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(
      () =>
        controller.abort(new DOMException("Request timed out", "TimeoutError")),
      timeout,
    );
    try {
      const response = await fetcher(`${base.replace(/\/$/, "")}${path}`, {
        method,
        credentials: "include",
        cache: "no-store",
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      const contentType = response.headers.get("content-type") || "";
      const data =
        response.status === 204
          ? null
          : contentType.includes("json")
            ? await response.json()
            : null;
      if (!response.ok) {
        if (response.status === 403) csrf = null; // Never automatically replay a mutation.
        if (response.status === 401 && !quiet && typeof window !== "undefined")
          window.dispatchEvent(new Event("session-expired"));
        const message =
          data?.message ||
          {
            401: "Please sign in to continue.",
            403: "You do not have permission to do this. Please refresh and try again.",
            404: "This item could not be found.",
            409: "This item has changed. Refresh and try again.",
            429: "Too many requests. Please wait and try again.",
            503: "This service is currently unavailable.",
          }[response.status] ||
          "The request could not be completed.";
        throw new ApiError(
          message,
          response.status,
          data?.errors || {},
          data?.code || "",
        );
      }
      if (response.status !== 204 && !contentType.includes("json"))
        throw new ApiError("The service returned an unexpected response.");
      return data;
    } catch (error) {
      if (error instanceof ApiError || signal?.aborted) throw error;
      throw new ApiError(
        controller.signal.aborted
          ? "The request took too long. Please try again."
          : "Unable to connect. Please check your connection and try again.",
      );
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    }
  }
  async function refreshCsrf() {
    if (!pendingCsrf)
      pendingCsrf = request("/api/auth/csrf", { quiet: true })
        .then((token) => {
          if (!token?.headerName || !token?.token)
            throw new ApiError("Could not establish a secure session.");
          csrf = token;
        })
        .finally(() => {
          pendingCsrf = null;
        });
    return pendingCsrf;
  }
  return {
    get: (path, signal) => request(path, { signal }),
    request,
    refreshCsrf,
    clearCsrf: () => {
      csrf = null;
    },
    send: (path, method = "POST", body) => request(path, { method, body }),
  };
}
export const api = createApi();
