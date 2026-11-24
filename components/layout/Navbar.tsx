import { getAuthUser } from "@/lib/auth";
import { signOut } from "@/actions/auth";
import { Brand } from "@/components/layout/Brand";
import { HomepageActionLink } from "@/components/homepage/HomepageActionLink";
import { PostHogIdentity, PostHogSignOutButton } from "@/components/auth/LoginForm";
import { AppNavigation } from "@/components/layout/AppNavigation";
import type { ReactElement } from "react";

export async function Navbar(): Promise<ReactElement> {
  const user = await getAuthUser();
  return <header className="border-b border-border bg-surface">
    <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-0 px-6 sm:h-16">
      <Brand />
      <AppNavigation />
      {user ? <><PostHogIdentity userId={user.id} email={user.email} /><form action={signOut}><PostHogSignOutButton className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dark" /></form></> : <HomepageActionLink destination="/login" label="start_for_free" placement="navbar" className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dark">Start for free</HomepageActionLink>}
    </div>
  </header>;
}
