import { getAuthUser } from "@/lib/auth";
import { HomepageActionLink } from "@/components/homepage/HomepageActionLink";
import type { ReactElement } from "react";

export async function HomepageActions({ placement }: { placement: "hero" | "call_to_action" }): Promise<ReactElement> {
  const destination = await getAuthUser() ? "/dashboard" : "/login";
  return <div className="flex flex-wrap items-center justify-center gap-4">
    <HomepageActionLink destination={destination} label="get_started" placement={placement} className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dark">Get Started <span aria-hidden="true" className="ml-1 text-xs text-accent-foreground/60">▶</span></HomepageActionLink>
    <HomepageActionLink destination={destination} label="find_your_first_match" placement={placement} className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary">Find Your First Match</HomepageActionLink>
  </div>;
}
