import "server-only";

export const PKCE_COOKIE = "nextrole_oauth_verifier";

export function getAppUrl(): string {
  const value = process.env.APP_URL;
  if (!value) throw new Error("APP_URL must be configured for OAuth.");
  const url = new URL(value);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
    throw new Error("APP_URL must use HTTPS outside localhost.");
  }
  return url.origin;
}
