import Link from "next/link";
import type { ReactElement } from "react";
import type { JobDetails } from "@/lib/job-details";
import { DetailIcon } from "@/components/job-details/DetailIcon";
import { JobInfo } from "@/components/job-details/JobInfo";
import { MatchScore } from "@/components/job-details/MatchScore";
import { JobDescription } from "@/components/job-details/JobDescription";
import { CompanyResearch } from "@/components/job-details/CompanyResearch";

type Props = { job: JobDetails; now: number };
export function JobDetailsView({ job, now }: Props): ReactElement {
  return <div className="space-y-6"><div><Link href="/find-jobs" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent"><DetailIcon name="back" className="size-4" />Back to Jobs</Link></div><JobInfo job={job} now={now} /><MatchScore job={job} /><JobDescription job={job} /><CompanyResearch key={job.id} company={job.company} jobId={job.id} initialResearch={job.research} /><a className="app-primary flex w-full items-center justify-center py-3 text-center" href={job.external_apply_url} target="_blank" rel="noopener noreferrer">Apply Now at {job.company}<span className="sr-only"> (opens in a new tab)</span></a><p className="app-muted text-center"><a href="https://www.adzuna.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent">Jobs by Adzuna</a></p></div>;
}
