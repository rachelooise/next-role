"use client";

import { useRef, useState, useTransition, type FormEvent, type ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MATCH_THRESHOLD } from "@/lib/utils";
import { COUNTRIES, parseJobSearch, type JobListing } from "@/lib/job-discovery";
import { requestJobDiscovery } from "@/lib/job-discovery-client";
import { JobsTable } from "@/components/find-jobs/JobsTable";
import { JOB_PAGE_SIZE, type JobFilters } from "@/lib/job-filters";

type Props = { jobs: JobListing[]; total: number; ready: boolean; error: string | null; filters: JobFilters };

export function JobsExplorer({ jobs: savedJobs, total, ready, error, filters }: Props): ReactElement {
  const router = useRouter();
  const lock = useRef(false);
  const [refreshing, startRefresh] = useTransition();
  const [searching, setSearching] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; kind: "success" | "warning" | "error" } | null>(null);
  const busy = searching || refreshing;
  const pages = Math.max(1, Math.ceil(total / JOB_PAGE_SIZE));
  const currentPage = filters.page;
  function navigate(changes: Partial<JobFilters>): void {
    const next = { ...filters, ...changes };
    const params = new URLSearchParams({ query: next.query, match: next.match, sort: next.sort, page: String(next.page) });
    startRefresh(() => router.push(`/find-jobs?${params.toString()}`));
  }

  async function search(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (lock.current || busy || !ready) return;
    const form = new FormData(event.currentTarget);
    lock.current = true;
    setSearching(true);
    setFeedback(null);
    try {
      const result = await requestJobDiscovery(parseJobSearch({ jobTitle: form.get("jobTitle"), location: form.get("location"), country: form.get("country") }));
      setFeedback({ text: result.message, kind: result.warning ? "warning" : "success" });
      navigate({ page: 1 });
    } catch (failure) {
      setFeedback({ text: failure instanceof Error ? failure.message : "Could not complete the search. Reload before retrying.", kind: "error" });
    } finally {
      setSearching(false);
      lock.current = false;
      startRefresh(() => router.refresh());
    }
  }

  return <div className="app-page space-y-6">
    <div className="app-card"><h1 className="app-heading">Find your next role</h1><p className="mt-2 app-muted">Discover opportunities that match your skills and ambitions.</p></div>
    {error && <p role="alert" className="app-card text-sm text-error">{error}</p>}
    {!ready && !error && <div className="app-card"><p className="text-sm text-text-primary">Save at least one skill and a current or desired job title before searching.</p><Link href="/profile" className="mt-3 inline-flex app-secondary">Complete your profile</Link></div>}
    <section className="app-card" aria-label="Job discovery" aria-busy={busy}>
      <form onSubmit={search}>
        <fieldset disabled={busy || !ready} className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_180px_auto]">
          <label className="grid gap-2 app-muted uppercase">Job title<input name="jobTitle" className="app-input" placeholder="Frontend Engineer" maxLength={150} required /></label>
          <label className="grid gap-2 app-muted uppercase">Location (optional)<input name="location" className="app-input" placeholder="City or region" maxLength={200} /></label>
          <label className="grid gap-2 app-muted uppercase">Country<select name="country" className="app-input" defaultValue="us">{COUNTRIES.map((country) => <option key={country.value} value={country.value}>{country.label}</option>)}</select></label>
          <button type="submit" className="app-primary min-h-11">{searching ? "Finding jobs…" : refreshing ? "Refreshing…" : "Find Jobs"}</button>
        </fieldset>
      </form>
      <p className="mt-3 app-muted">Up to 10 IT jobs per search. Google Gemini scores description snippets against your saved profile. Leave location blank to search the selected country.</p>
      {busy && <p role="status" className="mt-4 text-sm text-text-secondary">{searching ? "Searching Adzuna and scoring new jobs. This may take a minute or two." : "Refreshing your saved jobs…"}</p>}
      {feedback && <p role={feedback.kind === "error" ? "alert" : "status"} className={`mt-5 rounded-lg border p-3 text-sm ${feedback.kind === "success" ? "border-success-light bg-success-lightest text-success-foreground" : feedback.kind === "warning" ? "border-warning bg-surface-secondary text-text-primary" : "border-error text-error"}`}>{feedback.text}</p>}
    </section>
    <section aria-label="Saved job results" className="space-y-6">
      <div className="app-card space-y-3">
        <form className="flex flex-wrap gap-3" onSubmit={(event) => { event.preventDefault(); navigate({ query: String(new FormData(event.currentTarget).get("query") ?? ""), page: 1 }); }}>
          <label className="min-w-48 flex-1"><span className="sr-only">Filter by company or role</span><input key={filters.query} name="query" className="app-input w-full" placeholder="Filter by company or role…" defaultValue={filters.query} maxLength={100} /></label>
          <button type="submit" className="app-secondary">Search</button>
          <label><span className="sr-only">Match filter</span><select className="app-input" value={filters.match} onChange={(event) => navigate({ match: event.target.value as JobFilters["match"], page: 1 })}><option value="all">All Matches</option><option value="high">High Match</option><option value="low">Low Match</option></select></label>
          <label><span className="sr-only">Sort jobs</span><select className="app-input" value={filters.sort} onChange={(event) => navigate({ sort: event.target.value as JobFilters["sort"], page: 1 })}><option value="score">Match Score</option><option value="newest">Newest</option><option value="oldest">Oldest</option></select></label>
        </form>
        <p className="app-muted">{total} matching {total === 1 ? "job" : "jobs"}. Strong matches score {MATCH_THRESHOLD}% or higher.</p>
      </div>
      <JobsTable jobs={savedJobs} emptyText="No jobs match these filters. Try another company or role, or choose All Matches." />
      <div className="app-card flex flex-wrap items-center justify-between gap-4">
        <p className="app-muted">Showing {savedJobs.length ? (currentPage - 1) * JOB_PAGE_SIZE + 1 : 0} to {savedJobs.length ? (currentPage - 1) * JOB_PAGE_SIZE + savedJobs.length : 0} of {total} results</p>
        <nav aria-label="Job results pagination" className="flex flex-wrap gap-2">
          <button type="button" className="app-secondary" disabled={currentPage === 1} onClick={() => navigate({ page: currentPage - 1 })}>Previous</button>
          <span className="app-muted">Page {currentPage} of {pages}</span>
          <button type="button" className="app-secondary" disabled={currentPage >= pages} onClick={() => navigate({ page: currentPage + 1 })}>Next</button>
        </nav>
      </div>
      <p className="app-muted"><a className="hover:text-accent focus-visible:outline-accent" href="https://www.adzuna.com" target="_blank" rel="noopener noreferrer">Jobs by Adzuna</a>. Scores are based on description snippets and your profile at discovery time.</p>
    </section>
  </div>;
}
