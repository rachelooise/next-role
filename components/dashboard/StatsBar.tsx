import type { ReactElement } from "react";
import type { DashboardStat } from "@/lib/dashboard-stats";

type Props = { stats: DashboardStat[] };

export function StatsBar({ stats }: Props): ReactElement {
  return <section aria-label="Job search statistics" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
    {stats.map((stat) => <article key={stat.label} className="app-card">
      <h2 className="text-sm font-medium leading-5 text-text-secondary">{stat.label}</h2>
      <p className="mt-1 text-[30px] font-semibold leading-9 text-text-primary">{stat.value}</p>
      <div className="mt-2 flex items-center gap-2">
        {stat.trend && <span className="rounded-sm bg-success-lightest px-2 py-0.5 text-xs font-medium leading-4 text-success-darker">{stat.trend}</span>}
        <span className="app-muted">{stat.subtitle}</span>
      </div>
    </article>)}
  </section>;
}
