import { createAuthActions } from "@insforge/sdk/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAppUrl, PKCE_COOKIE } from "@/lib/auth-config";
import { flushPostHogLogs, logOAuthCallback } from "@/lib/posthog-logs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const failure = NextResponse.redirect(new URL("/login?error=oauth", getAppUrl()));
  failure.cookies.delete(PKCE_COOKIE);
  failure.headers.set("Cache-Control", "no-store");
  const code = request.nextUrl.searchParams.get("insforge_code");
  const verifier = request.cookies.get(PKCE_COOKIE)?.value;
  if (!code || !verifier || request.nextUrl.searchParams.has("error")) {
    logOAuthCallback("missing_or_rejected");
    flushPostHogLogs();
    return failure;
  }
  try {
    const response = NextResponse.redirect(new URL("/dashboard", getAppUrl()));
    const auth = createAuthActions({ requestCookies: request.cookies, responseCookies: response.cookies, timeout: 10000, retryCount: 0 });
    const { data, error } = await auth.exchangeOAuthCode(code, verifier);
    if (error || !data?.user) {
      logOAuthCallback("exchange_failed");
      flushPostHogLogs();
      return failure;
    }
    response.cookies.delete(PKCE_COOKIE);
    response.headers.set("Cache-Control", "no-store");
    logOAuthCallback("authenticated");
    flushPostHogLogs();
    return response;
  } catch {
    logOAuthCallback("exchange_failed");
    flushPostHogLogs();
    return failure;
  }
}
