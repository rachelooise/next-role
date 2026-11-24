import { Suspense, type ReactElement } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { requireAuthUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import type { Profile } from "@/types/database";
import { loadDashboardStats } from "@/lib/dashboard-stats-server";
import { loadDashboardActivity } from "@/lib/dashboard-activity-server";
import { loadDashboardAnalytics } from "@/lib/dashboard-analytics-server";

async function DashboardContent(): Promise<ReactElement> {
  const user = await requireAuthUser();
  const [statsResult, activityResult, analytics] = await Promise.all([loadDashboardStats(), loadDashboardActivity(user.id), loadDashboardAnalytics()]);
  let profileState: "complete" | "incomplete" | "unavailable" = "unavailable";
  try {
    const client = await createInsforgeServer();
    const { data, error } = await client.database.from("profiles").select("is_complete").eq("id", user.id).maybeSingle<Pick<Profile, "is_complete">>();
    if (error) {
      console.error("[dashboard] Could not load profile completion");
    } else {
      profileState = data?.is_complete ? "complete" : "incomplete";
    }
  } catch {
    console.error("[dashboard] Could not load profile completion");
  }
  return <DashboardView profileState={profileState} statsResult={statsResult} activityResult={activityResult} analytics={analytics} />;
}

export default function DashboardPage(): ReactElement {
  return <>
    <Suspense fallback={<div className="min-h-20 border-b border-border bg-surface" />}><Navbar /></Suspense>
    <main className="app-page mx-auto w-full max-w-[1440px] p-4 sm:p-8"><h1 className="sr-only">Dashboard</h1><Suspense fallback={<p role="status" className="app-muted">Loading your dashboard…</p>}><DashboardContent /></Suspense></main>
  </>;
}
