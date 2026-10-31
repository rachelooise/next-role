import { getAuthUser } from "@/lib/auth";
import { signOut } from "@/actions/auth";
import { Brand } from "@/components/layout/Brand";
import { HomepageActionLink } from "@/components/homepage/HomepageActionLink";
import { PostHogIdentity, PostHogSignOutButton } from "@/components/auth/LoginForm";
import Link from "next/link";
import type { ReactElement } from "react";

export async function Navbar(): Promise<ReactElement> {
  const user = await getAuthUser();
  return <header className="border-b border-border bg-surface">
    <div className="landing-frame mx-auto flex min-h-20 flex-wrap items-center justify-between gap-3 py-4 sm:py-0">
      <Brand />
      <nav aria-label="Main navigation" className="order-3 flex w-full justify-center gap-8 text-sm text-text-dark sm:order-none sm:w-auto">
        <Link className="landing-link" href="/dashboard">Dashboard</Link>
        <Link className="landing-link" href="/find-jobs">Find Jobs</Link>
        <Link className="landing-link" href="/profile">Profile</Link>
      </nav>
      {user ? <><PostHogIdentity userId={user.id} email={user.email} /><form action={signOut}><PostHogSignOutButton className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dark" /></form></> : <HomepageActionLink destination="/login" label="start_for_free" placement="navbar" className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dark">Start for free</HomepageActionLink>}
    </div>
  </header>;
}
