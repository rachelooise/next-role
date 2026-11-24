"use client";

import { useRef, useState, useTransition, type FormEvent, type ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MATCH_THRESHOLD } from "@/lib/utils";
import { COUNTRIES, parseJobSearch, type JobListing } from "@/lib/job-discovery";
import { requestJobDiscovery } from "@/lib/job-discovery-client";
import { JobsTable } from "@/components/find-jobs/JobsTable";

type Props = { jobs: JobListing[]; total: number; ready: boolean; error: string | null };
const pageSize = 6;

export function JobsExplorer({ jobs: savedJobs, total, ready, error }: Props): ReactElement {
  const router = useRouter();
  const lock = useRef(false);
  const [refreshing, startRefresh] = useTransition();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [match, setMatch] = useState("all");
  const [sort, setSort] = useState("score");
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<{ text: string; kind: "success" | "warning" | "error" } | null>(null);
  const busy = searching || refreshing;
  const jobs = savedJobs.filter((job) => `${job.company} ${job.title}`.toLowerCase().includes(query.toLowerCase()) && (match === "all" || (match === "high" ? job.match_score >= MATCH_THRESHOLD : job.match_score < MATCH_THRESHOLD))).sort((a, b) => sort === "score" ? b.match_score - a.match_score : sort === "newest" ? Date.parse(b.found_at) - Date.parse(a.found_at) : Date.parse(a.found_at) - Date.parse(b.found_at));
  const pages = Math.max(1, Math.ceil(jobs.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = jobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
      setPage(1);
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
        <div className="flex flex-wrap gap-3">
          <label className="min-w-48 flex-1"><span className="sr-only">Filter by company or role</span><input className="app-input w-full" placeholder="Filter by company or role…" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
          <label><span className="sr-only">Match filter</span><select className="app-input" value={match} onChange={(event) => { setMatch(event.target.value); setPage(1); }}><option value="all">All Matches</option><option value="high">High Match</option><option value="low">Low Match</option></select></label>
          <label><span className="sr-only">Sort jobs</span><select className="app-input" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="score">Match Score</option><option value="newest">Newest</option><option value="oldest">Oldest</option></select></label>
        </div>
        <p className="app-muted">{total > savedJobs.length ? `Browsing the latest ${savedJobs.length} of ${total} saved jobs. Filters apply to these loaded jobs.` : `${total} saved ${total === 1 ? "job" : "jobs"}. Strong matches score ${MATCH_THRESHOLD}% or higher.`}</p>
      </div>
      <JobsTable jobs={visible} emptyText={savedJobs.length ? "No jobs match these filters. Try another company or role, or choose All Matches." : "No saved jobs yet. Search above to find your first matches."} />
      <div className="app-card flex flex-wrap items-center justify-between gap-4">
        <p className="app-muted">Showing {jobs.length ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, jobs.length)} of {jobs.length} loaded results</p>
        <nav aria-label="Job results pagination" className="flex flex-wrap gap-2">
          <button type="button" className="app-secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
          {Array.from({ length: pages }, (_, index) => <button type="button" className={currentPage === index + 1 ? "app-primary" : "app-secondary"} aria-current={currentPage === index + 1 ? "page" : undefined} key={index} onClick={() => setPage(index + 1)}>{index + 1}</button>)}
          <button type="button" className="app-secondary" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Next</button>
        </nav>
      </div>
      <p className="app-muted"><a className="hover:text-accent focus-visible:outline-accent" href="https://www.adzuna.com" target="_blank" rel="noopener noreferrer">Jobs by Adzuna</a>. Scores are based on description snippets and your profile at discovery time.</p>
    </section>
  </div>;
}
