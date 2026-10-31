"use client";

import { useActionState, useEffect, type ReactElement } from "react";
import { startOAuth } from "@/actions/auth";
import { isPostHogConfigured } from "@/instrumentation-client";
import posthog from "posthog-js";

type PostHogIdentityProps = {
  userId: string;
  email: string;
};

export function PostHogIdentity({ userId, email }: PostHogIdentityProps): ReactElement | null {
  useEffect(() => {
    if (isPostHogConfigured) {
      posthog.identify(userId, { email });
    }
  }, [email, userId]);

  return null;
}

export function PostHogSignOutButton({ className }: { className: string }): ReactElement {
  const handleClick = () => {
    if (isPostHogConfigured) {
      posthog.capture("user_signed_out", {}, { transport: "sendBeacon", send_instantly: true });
      posthog.reset();
    }
  };

  return <button type="submit" onClick={handleClick} className={className}>Sign out</button>;
}

export function LoginForm({ callbackFailed }: { callbackFailed: boolean }): ReactElement {
  const [state, action, pending] = useActionState(startOAuth, { error: null });
  const error = state.error ?? (callbackFailed ? "Sign-in could not be completed. Please try again." : null);
  const handleProviderClick = (provider: "google" | "github") => {
    if (isPostHogConfigured) {
      posthog.capture("oauth_sign_in_started", { provider }, { transport: "sendBeacon", send_instantly: true });
    }
  };

  return <form action={action} className="mt-8 flex flex-col gap-4" aria-busy={pending}>
    <button type="submit" name="provider" value="google" disabled={pending} onClick={() => handleProviderClick("google")} className="min-h-12 rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60">Continue with Google</button>
    <button type="submit" name="provider" value="github" disabled={pending} onClick={() => handleProviderClick("github")} className="min-h-12 rounded-md bg-accent px-4 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60">Continue with GitHub</button>
    <p role="status" className="min-h-5 text-center text-sm text-text-secondary">{pending ? "Connecting to your sign-in provider…" : "Use your existing account to get started."}</p>
    {error && <p role="alert" className="rounded-md border border-error p-3 text-sm text-text-primary">{error}</p>}
  </form>;
}
