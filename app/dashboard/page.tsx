import { Suspense, type ReactElement } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardWelcome } from "@/components/auth/DashboardWelcome";

export default function DashboardPage(): ReactElement {
  return <>
    <Suspense fallback={<div className="min-h-20 border-b border-border bg-surface" />}><Navbar /></Suspense>
    <main className="mx-auto w-full max-w-7xl p-8"><Suspense fallback={<p role="status">Loading your dashboard…</p>}><DashboardWelcome /></Suspense></main>
  </>;
}
