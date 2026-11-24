import { Suspense, type ReactElement } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { JobsExplorer } from "@/components/find-jobs/JobsExplorer";
import { requireAuthUser } from "@/lib/auth";
import { loadJobs } from "@/lib/jobs";

async function JobsContent(): Promise<ReactElement> {
  const user = await requireAuthUser();
  return <JobsExplorer {...await loadJobs(user.id)} />;
}

export default function FindJobsPage(): ReactElement {
  return <><Suspense fallback={<div className="min-h-16 border-b bg-surface" />}><Navbar /></Suspense><main className="mx-auto w-full max-w-[1440px] p-8"><Suspense fallback={<p role="status">Loading jobs…</p>}><JobsContent /></Suspense></main></>;
}
