import { Suspense, type ReactElement } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { JobsExplorer } from "@/components/find-jobs/JobsExplorer";
import { requireAuthUser } from "@/lib/auth";
import { loadJobs } from "@/lib/jobs";
import { parseJobFilters } from "@/lib/job-filters";

async function JobsContent({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<ReactElement> {
  const user = await requireAuthUser();
  const filters = parseJobFilters(await searchParams);
  return <JobsExplorer {...await loadJobs(user.id, filters)} filters={filters} />;
}

export default function FindJobsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): ReactElement {
  return <><Suspense fallback={<div className="min-h-16 border-b bg-surface" />}><Navbar /></Suspense><main className="mx-auto w-full max-w-[1440px] p-8"><Suspense fallback={<p role="status">Loading jobs…</p>}><JobsContent searchParams={searchParams} /></Suspense></main></>;
}
