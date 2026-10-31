import { Brand } from "@/components/layout/Brand";
import Link from "next/link";
import type { ReactElement } from "react";

export function Footer(): ReactElement {
  return <footer className="landing-frame mx-auto flex min-h-[132px] flex-col items-center justify-between gap-6 border-x border-t border-border px-8 py-10 sm:flex-row">
    <Brand />
    <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-8 text-sm text-text-dark">
      <Link className="landing-link" href="/dashboard">Dashboard</Link>
      <Link className="landing-link" href="/privacy-policy">Privacy Policy</Link>
      <Link className="landing-link" href="/terms">Terms &amp; Condition</Link>
    </nav>
  </footer>;
}
