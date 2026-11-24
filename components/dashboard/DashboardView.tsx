import Link from "next/link";
import type { ReactElement } from "react";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { BarChart } from "@/components/dashboard/BarChart";
import { JobsLineChart } from "@/components/dashboard/JobsLineChart";
import type { DashboardAnalytics, AnalyticsChart } from "@/lib/dashboard-analytics-server";
import { formatDashboardStats, type DashboardStatsResult } from "@/lib/dashboard-stats";
import type { DashboardActivityResult } from "@/lib/dashboard-activity";

type Props = { profileState: "complete" | "incomplete" | "unavailable"; statsResult: DashboardStatsResult; activityResult: DashboardActivityResult; analytics: DashboardAnalytics };

function ChartState({ chart, children }: { chart: AnalyticsChart; children: ReactElement }): ReactElement {
  if (chart.error) return <p role="status" className="app-muted mt-5">Analytics unavailable. <a href="/dashboard" className="underline">Reload dashboard</a></p>;
  if (!chart.points.some(point => point.value > 0)) return <p className="app-muted mt-5">No activity for this period yet.</p>;
  return children;
}

export function DashboardView({ profileState, statsResult, activityResult, analytics }: Props): ReactElement {
  return <div className="space-y-6">
    {profileState === "incomplete" && <section aria-label="Complete your profile" className="app-card flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="app-heading">Complete your profile</h2><p className="app-muted mt-1">Add your skills and job preferences to find your best matches.</p></div>
      <Link href="/profile" className="app-primary">Complete Profile</Link>
    </section>}
    {profileState === "unavailable" && <p role="status" className="app-muted">Profile completion is unavailable. <Link href="/profile" className="text-accent underline">View your profile</Link></p>}
    {statsResult.error && <p role="alert" className="text-sm text-error">{statsResult.error} <a href="/dashboard" className="underline underline-offset-2">Reload dashboard</a></p>}
    <StatsBar stats={formatDashboardStats(statsResult.stats)} />
    <div className="grid gap-6 lg:grid-cols-2">
      <RecentActivity entries={activityResult.entries} error={activityResult.error} />
      <section aria-labelledby="research-chart-title" className="app-card flex min-w-0 flex-col lg:min-h-[408px]">
        <h2 id="research-chart-title" className="app-heading">Company Research Activity</h2>
        <p className="app-muted mt-1">Last 7 days · UTC</p><ChartState chart={analytics.research}><div className="mt-10 h-[270px] sm:mt-12"><BarChart title="Company Research Activity" points={analytics.research.points.map(p => ({ ...p, label: p.label.slice(5) }))} maximum={Math.max(4, Math.ceil(Math.max(...analytics.research.points.map(p => p.value)) / 4) * 4)} tone="info" /></div></ChartState>
      </section>
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <section aria-labelledby="jobs-chart-title" className="app-card min-w-0 lg:col-span-2">
        <h2 id="jobs-chart-title" className="app-heading">Jobs Found Over Time</h2>
        <p className="app-muted mt-1">Last 30 days · UTC</p><ChartState chart={analytics.jobs}><div className="mt-5 h-[270px]"><JobsLineChart points={analytics.jobs.points} /></div></ChartState>
      </section>
      <section aria-labelledby="match-chart-title" className="app-card min-w-0">
        <h2 id="match-chart-title" className="app-heading">Match Score Distribution</h2>
        <p className="app-muted mt-1">All available event history</p><ChartState chart={analytics.scores}><div className="mt-5 h-[270px]"><BarChart title="Match Score Distribution" points={analytics.scores.points} maximum={Math.max(4, Math.ceil(Math.max(...analytics.scores.points.map(p => p.value)) / 4) * 4)} tone="success" /></div></ChartState>
      </section>
    </div>
  </div>;
}
