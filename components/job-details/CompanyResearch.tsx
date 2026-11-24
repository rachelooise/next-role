"use client";

import { useEffect, useState, type ReactElement } from "react";
import { DetailIcon } from "@/components/job-details/DetailIcon";
import { ResearchDossier } from "@/components/job-details/ResearchDossier";
import { isResearchActive, type ResearchState } from "@/lib/company-research";
import { checkResearch, startResearch } from "@/lib/research-client";

type Props = { company: string; jobId: string; initialResearch: ResearchState };

export function CompanyResearch({ company, jobId, initialResearch }: Props): ReactElement {
  const [state, setState] = useState(initialResearch);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const active = isResearchActive(state.status);

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let failures = 0;
    const poll = async (): Promise<void> => {
      try {
        const next = await checkResearch(jobId, controller.signal);
        if (controller.signal.aborted) return;
        setState(next);
        setError(null);
        failures = 0;
        if (!isResearchActive(next.status)) return;
      } catch {
        if (controller.signal.aborted) return;
        failures++;
        setError("Could not check progress. Research may still be running; retry the status check below.");
      }
      if (!controller.signal.aborted) timer = setTimeout(() => { void poll(); }, failures ? 10000 : 4000);
    };
    void poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [active, jobId]);

  async function handleResearch(): Promise<void> {
    setPending(true);
    setError(null);
    setCheckedAt(null);
    try { setState(await startResearch(jobId)); }
    catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not start research. Please retry.");
      try { setState(await checkResearch(jobId)); } catch { /* The start error remains visible. */ }
    } finally { setPending(false); }
  }

  async function handleCheck(): Promise<void> {
    setChecking(true);
    try { setState(await checkResearch(jobId)); setError(null); setCheckedAt(new Date()); }
    catch { setError("Could not check research. Please retry in a moment."); }
    finally { setChecking(false); }
  }

  return <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-app-card" aria-labelledby="research-heading">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
      <h2 id="research-heading" className="app-heading flex items-center gap-3"><span className="flex size-7 items-center justify-center rounded-xl bg-accent-muted text-accent"><DetailIcon name="company" className="size-4" /></span>Company Research</h2>
      <button className="app-primary inline-flex items-center gap-2" type="button" disabled={pending || active} onClick={() => { void handleResearch(); }}><DetailIcon name="search" className="size-4" />{pending ? "Starting…" : active ? "Researching…" : state.status === "failed" ? "Retry research" : state.dossier ? "Refresh research" : "Research Company"}</button>
    </div>
    <div className="px-6 py-5">
      <div role="status" aria-live="polite" className="text-sm leading-5 text-text-secondary">
        {checking ? <p>Checking research status…</p> : checkedAt && <p>Status checked at {checkedAt.toLocaleTimeString()}.</p>}
        {active && <p>{state.status === "queued" ? "Research is queued." : `Researching ${company}…`} You can leave this page and return later.</p>}
        {!active && state.status === "failed" && <p>Research failed. Select Retry research to start a new attempt.</p>}
        {!active && state.status === "idle" && checkedAt && <p>No research has started. Select Research Company to begin.</p>}
        {!active && state.status === "completed" && <p>Research saved{state.researchedAt ? ` · ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(state.researchedAt))}` : ""}.</p>}
      </div>
      {(error || state.error) && <div className="mt-3 space-y-3"><p role="alert" className="text-sm text-error">{error || state.error}</p><button type="button" className="app-secondary" disabled={checking} onClick={() => { void handleCheck(); }}>{checking ? "Checking…" : "Check status"}</button></div>}
      {state.dossier ? <ResearchDossier dossier={state.dossier} /> : !active && state.status !== "failed" && <div className="flex flex-col items-center py-7 text-center"><span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-surface-secondary text-text-muted"><DetailIcon name="company" className="size-6" /></span><p className="text-sm font-medium">No research yet</p><p className="mt-2 max-w-80 text-sm leading-5 text-text-muted">Research {company}&apos;s public pages and get a briefing tailored to your saved job and profile.</p></div>}
      <p className="app-muted mt-4">Powered by Google Gemini. Your saved professional profile helps personalize this briefing.</p>
    </div>
  </section>;
}
