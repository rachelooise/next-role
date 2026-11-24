"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";

export function AppNavigation(): ReactElement {
  const pathname = usePathname();
  return <nav aria-label="Main navigation" className="order-3 flex w-full justify-center gap-5 text-sm sm:order-none sm:w-auto">{[{ href: "/dashboard", label: "Dashboard" }, { href: "/find-jobs", label: "Find Jobs" }, { href: "/profile", label: "Profile" }].map(({ href, label }) => { const active = pathname === href || pathname.startsWith(`${href}/`); return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`landing-link font-medium ${active ? "text-accent" : "text-navigation"}`}>{label}</Link>; })}</nav>;
}
