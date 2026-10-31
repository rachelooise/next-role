"use server";

import { createAuthActions } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAppUrl, PKCE_COOKIE } from "@/lib/auth-config";

export type AuthActionState = { error: string | null };

export async function startOAuth(_previous: AuthActionState, form: FormData): Promise<AuthActionState> {
  const provider = form.get("provider");
  if (provider !== "google" && provider !== "github") return { error: "Choose Google or GitHub to continue." };
  let destination: string;
  try {
    const store = await cookies();
    const auth = createAuthActions({ cookies: store, timeout: 10000, retryCount: 0 });
    const { data, error } = await auth.signInWithOAuth(provider, {
      redirectTo: `${getAppUrl()}/api/auth/callback`,
      skipBrowserRedirect: true,
    });
    if (error || !data?.url || !data.codeVerifier) {
      return { error: "Could not connect to your sign-in provider. Please try again." };
    }
    const url = new URL(data.url);
    if (url.protocol !== "https:") return { error: "The sign-in provider returned an invalid destination." };
    store.set(PKCE_COOKIE, data.codeVerifier, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600,
    });
    destination = url.toString();
  } catch {
    return { error: "Sign-in is temporarily unavailable. Please try again." };
  }
  redirect(destination);
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  const auth = createAuthActions({ cookies: store, timeout: 10000, retryCount: 0 });
  const { error } = await auth.signOut();
  if (error) throw new Error("Could not sign out. Please try again.");
  store.delete(PKCE_COOKIE);
  redirect("/login");
}
