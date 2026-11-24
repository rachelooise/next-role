import type { ReactElement } from "react";
import type { DashboardActivity } from "@/lib/dashboard-activity";

type Props = { entries: DashboardActivity[]; error: string | null };
const dotClasses = { info: "border-info-light bg-info", success: "border-success-light bg-success-alt" };

export function RecentActivity({ entries, error }: Props): ReactElement {
  return <section aria-labelledby="recent-activity-title" className="overflow-hidden rounded-2xl border border-border bg-surface shadow-app-card">
    <h2 id="recent-activity-title" className="app-heading border-b border-border px-6 py-5">Recent Activity</h2>
    {error ? <p role="alert" className="p-6 text-sm text-error">{error} <a href="/dashboard" className="underline underline-offset-2">Reload dashboard</a></p> : entries.length ? <ol className="space-y-6 px-6 py-6">
      {entries.map((entry) => <li key={entry.id} className="relative flex gap-4">
        <span aria-hidden="true" className="relative flex w-2 shrink-0 justify-center">
          <span className="absolute top-0 h-10 w-px bg-border" />
          <span className={`relative mt-1 size-3.5 shrink-0 rounded-full border-[3px] ${dotClasses[entry.tone]}`} />
        </span>
        <div className="min-w-0 break-words"><p className="text-sm font-medium leading-5 text-text-primary">{entry.message}</p><time dateTime={entry.occurredAt} className="app-muted mt-1 block">{entry.time}</time></div>
      </li>)}
    </ol> : <p className="app-muted p-6">Your job searches and company research will appear here.</p>}
  </section>;
}
