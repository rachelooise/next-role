import type { ReactElement } from "react";
import { requireAuthUser } from "@/lib/auth";
import { signOut } from "@/actions/auth";
import { PostHogSignOutButton } from "@/components/auth/LoginForm";

export async function DashboardWelcome(): Promise<ReactElement> {
  const user = await requireAuthUser();
  return <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
    <h1 className="text-2xl font-semibold text-text-primary">Welcome to NextRole</h1>
    <p className="mt-3 text-sm text-text-secondary">You’re signed in as {user.email}.</p>
    <p className="mt-3 text-sm text-text-secondary">Your job search dashboard is coming soon.</p>
    <form action={signOut} className="mt-6"><PostHogSignOutButton className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-dark" /></form>
  </section>;
}
