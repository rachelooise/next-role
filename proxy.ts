import { updateSession } from "@insforge/sdk/ssr/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest): Promise<NextResponse> {
  // Refresh mutates request cookies; forward those updated values to rendering.
  const pending = NextResponse.next();
  const { accessToken } = await updateSession({ requestCookies: request.cookies, responseCookies: pending.cookies });
  const protectedRoute = /^\/(dashboard|profile|find-jobs)(\/|$)/.test(request.nextUrl.pathname);
  const response = protectedRoute && !accessToken
    ? NextResponse.redirect(new URL("/login", request.url))
    : NextResponse.next({ request: { headers: request.headers } });
  for (const cookie of pending.cookies.getAll()) response.cookies.set(cookie);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/", "/login", "/dashboard/:path*", "/profile/:path*", "/find-jobs/:path*"] };
