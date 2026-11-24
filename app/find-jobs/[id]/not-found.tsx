import Link from "next/link";
import type { ReactElement } from "react";

export default function JobNotFound(): ReactElement {
  return <main className="mx-auto max-w-[864px] p-8"><div className="app-card"><h1 className="app-heading">Job not found</h1><p className="app-muted mt-2">This job is unavailable or does not belong to your account.</p><Link className="app-secondary mt-4 inline-flex" href="/find-jobs">Back to Jobs</Link></div></main>;
}
