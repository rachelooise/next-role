import { Suspense, type ReactElement } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { JobDetailsView } from "@/components/job-details/JobDetailsView";
import { requireAuthUser } from "@/lib/auth";
import { loadJobDetails } from "@/lib/job-details-server";

type Props = { params: Promise<{ id: string }> };
async function JobContent({ params }: Props): Promise<ReactElement> {
  const user = await requireAuthUser();
  const { id } = await params;
  const { job, error, loadedAt } = await loadJobDetails(user.id, id);
  if (error) return <div className="app-card"><p role="alert" className="text-sm text-error">{error}</p><Link className="app-secondary mt-4 inline-flex" href="/find-jobs">Back to Jobs</Link></div>;
  if (!job) notFound();
  return <JobDetailsView job={job} now={loadedAt} />;
}
export default function JobDetailsPage({ params }: Props): ReactElement {
  return <><Suspense fallback={<div className="min-h-16 border-b border-border bg-surface" />}><Navbar /></Suspense><main className="mx-auto w-full max-w-[864px] px-4 py-8 sm:px-8"><Suspense fallback={<p role="status" className="app-muted">Loading job details…</p>}><JobContent params={params} /></Suspense></main></>;
}
