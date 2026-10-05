// Public configuration only. Never put credentials or provider keys in this file.
const location = globalThis.location || {
  hostname: "localhost",
  protocol: "http:",
  origin: "http://localhost:8080",
};
const local = ["localhost", "127.0.0.1"].includes(location.hostname);
export const config = Object.freeze({
  apiBase: local
    ? `${location.protocol}//${location.hostname}:8080`
    : location.origin,
  googleEnabled: false, // Enable only after the backend Google profile is configured.
  requestTimeoutMs: 15000,
});
