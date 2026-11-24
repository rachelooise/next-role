import type { ReactElement } from "react";
import Link from "next/link";
import type { JobListing } from "@/lib/job-discovery";

type Props = { jobs: JobListing[]; emptyText: string };

export function JobsTable({ jobs, emptyText }: Props): ReactElement {
  return <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-app-card">
    <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
      <caption className="sr-only">Your saved jobs from Adzuna</caption>
      <thead className="bg-surface text-xs uppercase text-text-secondary"><tr>{["Company", "Role", "Match score", "Salary", "Source", "Date found"].map((heading) => <th key={heading} scope="col" className="px-6 py-5 font-medium">{heading}</th>)}</tr></thead>
      <tbody>{jobs.map((job) => <tr key={job.id} className="border-t border-border hover:bg-surface-secondary">
        <th scope="row" className="px-6 py-6 font-medium"><span className="mr-3 inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface-muted text-accent" aria-hidden="true">{job.company[0]}</span>{job.company}</th>
        <td className="px-6 py-6"><Link href={`/find-jobs/${job.id}`} className="font-medium hover:text-accent focus-visible:outline-accent">{job.title}</Link><p className="mt-1 app-muted">{job.location || "Location not provided"}</p></td>
        <td className="px-6 py-6"><div className="flex items-center gap-3"><meter className={`job-meter ${job.match_score >= 80 ? "text-success" : job.match_score >= 60 ? "text-info" : "text-warning"}`} min="0" max="100" value={job.match_score} aria-label={`${job.title} match score`}>{job.match_score}%</meter><span className="font-medium">{job.match_score}%</span></div></td>
        <td className="px-6 py-6 text-text-primary">{job.salary || "Not provided"}</td>
        <td className="px-6 py-6"><span className="rounded-full bg-surface-muted px-2 py-0.5 app-muted">Search</span></td>
        <td className="whitespace-nowrap px-6 py-6 text-text-primary"><time dateTime={job.found_at}>{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(job.found_at))}</time></td>
      </tr>)}</tbody>
    </table></div>
    {!jobs.length && <div className="p-12 text-center"><p className="app-muted">{emptyText}</p></div>}
  </div>;
}
