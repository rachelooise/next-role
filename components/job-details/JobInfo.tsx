import type { ReactElement } from "react";
import type { JobDetails } from "@/lib/job-details";
import { dateFoundLabel } from "@/lib/job-details";
import { MATCH_THRESHOLD } from "@/lib/utils";
import { DetailIcon } from "@/components/job-details/DetailIcon";

type Props = { job: JobDetails; now: number };
export function JobInfo({ job, now }: Props): ReactElement {
  const stats = [
    { name: "salary", label: "Salary est.", value: job.salary || "—", color: "bg-success-lightest text-success" },
    { name: "location", label: "Location", value: job.location || "—", color: "bg-info-lightest text-info-medium" },
    { name: "briefcase", label: "Job type", value: job.job_type || "—", color: "bg-accent-muted text-accent" },
    { name: "calendar", label: "Date found", value: dateFoundLabel(job.found_at, now), color: "bg-surface-secondary text-text-secondary" },
  ] as const;
  return <>
    <section className="app-card flex flex-col items-start justify-between gap-5 sm:flex-row" aria-label="Job summary">
      <div className="flex w-full min-w-0 flex-1 items-center gap-4 sm:w-auto">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface-secondary text-text-muted"><DetailIcon name="company" className="size-6" /></span>
        <div className="min-w-0"><h1 className="break-words text-2xl font-bold leading-8 tracking-tight">{job.title}</h1><div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-text-secondary"><span className="break-words">{job.company}</span><span aria-hidden="true" className="text-text-muted">•</span><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${job.match_score >= MATCH_THRESHOLD ? "bg-success-lightest text-success-foreground" : "bg-accent-muted text-accent"}`}>{job.match_score}% Match Score</span></div></div>
      </div>
      <a className="app-secondary inline-flex items-center justify-center gap-2" href={job.external_apply_url} target="_blank" rel="noopener noreferrer"><DetailIcon name="external" className="size-4" />View Job Post<span className="sr-only"> (opens in a new tab)</span></a>
    </section>
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{stats.map((stat) => <div key={stat.label} className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-surface p-4"><span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${stat.color}`}><DetailIcon name={stat.name} className="size-5" /></span><div className="flex min-w-0 flex-col-reverse gap-1"><dt className="app-muted uppercase">{stat.label}</dt><dd className="truncate text-sm font-semibold" title={stat.value}>{stat.name === "calendar" ? <time dateTime={job.found_at}>{stat.value}</time> : stat.value}</dd></div></div>)}</dl>
  </>;
}
