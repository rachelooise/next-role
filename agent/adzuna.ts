import "server-only";
import type { InsForgeClient } from "@insforge/sdk";
import { searchJobs, type AdzunaJob } from "@/lib/adzuna";
import { matchJob } from "@/agent/matcher";
import { MATCH_THRESHOLD } from "@/lib/utils";
import { captureDiscoveryEvents, type DiscoveryEvent } from "@/lib/posthog-server";
import type { DiscoverySummary, JobSearch } from "@/lib/job-discovery";
import type { ProfileInput } from "@/lib/profile";

type DiscoveryResult = { success: boolean; data?: DiscoverySummary; error?: string };

async function logRun(client: InsForgeClient, userId: string, summary: DiscoverySummary, level: "error" | "warning" | "success"): Promise<void> {
  try {
    const result = await client.database.from("agent_logs").insert([{ user_id: userId, run_id: summary.runId, level, message: `Job discovery: ${summary.retrieved} retrieved, ${summary.saved} saved, ${summary.strong} strong, ${summary.duplicates} duplicates, ${summary.failed} failed. Status ${summary.finalized ? "recorded" : "not confirmed"}.` }]);
    if (result.error) console.error("[agent/find] Could not record summary");
  } catch { console.error("[agent/find] Could not record summary"); }
}

export async function discoverJobs(client: InsForgeClient, userId: string, search: JobSearch, profile: ProfileInput): Promise<DiscoveryResult> {
  const summary: DiscoverySummary = { runId: "", retrieved: 0, saved: 0, strong: 0, duplicates: 0, failed: 0, finalized: false };
  const events: DiscoveryEvent[] = [];
  let fatal: string | undefined;
  try {
    const run = await client.database.from("agent_runs").insert([{ user_id: userId, status: "running", job_title_searched: search.jobTitle, location_searched: search.location || null }]).select("id").single();
    if (run.error || typeof run.data?.id !== "string") return { success: false, error: "Could not start the search. Please retry." };
    summary.runId = run.data.id;
    events.push({ event: "job_search_started", timestamp: new Date(), properties: { jobTitle: search.jobTitle, location: search.location, country: search.country } });
    const found = await searchJobs(search);
    summary.retrieved = found.retrieved;
    summary.failed = found.invalid;
    const unique: AdzunaJob[] = [];
    const seen = new Set<string>();
    for (const job of found.jobs) {
      if (seen.has(job.id)) { summary.duplicates++; continue; }
      seen.add(job.id); unique.push(job);
    }
    const existing = unique.length ? await client.database.from("jobs").select("external_id").eq("user_id", userId).eq("source", "search").in("external_id", unique.map((job) => job.id)) : { data: [], error: null };
    if (existing.error) throw new Error("Could not check previously saved jobs. Please retry.");
    const savedIds = new Set((existing.data ?? []).map((row: { external_id: string }) => row.external_id));
    const pending = unique.filter((job) => { if (savedIds.has(job.id)) { summary.duplicates++; return false; } return true; });
    const signal = AbortSignal.timeout(100000);
    let cursor = 0;
    async function worker(): Promise<void> {
      while (cursor < pending.length) {
        const job = pending[cursor++];
        try {
          if (signal.aborted) { summary.failed++; continue; }
          const match = await matchJob(job, profile, signal);
          if (!match.success) { summary.failed++; continue; }
          const result = await client.database.from("jobs").insert([{
            user_id: userId, run_id: summary.runId, source: "search", external_id: job.id,
            source_url: job.redirectUrl, external_apply_url: job.redirectUrl, title: job.title, company: job.company,
            location: job.location, salary: job.salary, job_type: job.jobType, about_role: job.description,
            match_score: match.data.matchScore, match_reason: match.data.matchReason,
            matched_skills: match.data.matchedSkills, missing_skills: match.data.missingSkills,
          }]).select("id").single();
          if (result.error) {
            // Another search can insert between the duplicate read and this insert.
            const duplicate = await client.database.from("jobs").select("id").eq("user_id", userId).eq("source", "search").eq("external_id", job.id).maybeSingle();
            if (!duplicate.error && duplicate.data) summary.duplicates++;
            else summary.failed++;
            continue;
          }
          if (!result.data?.id) { summary.failed++; continue; }
          summary.saved++;
          if (match.data.matchScore >= MATCH_THRESHOLD) summary.strong++;
          events.push({ event: "job_found", timestamp: new Date(), properties: { source: "search", matchScore: match.data.matchScore } });
        } catch { summary.failed++; console.error("[agent/find] A listing could not be processed"); }
      }
    }
    await Promise.all(Array.from({ length: Math.min(3, pending.length) }, () => worker()));
  } catch (error) {
    console.error("[agent/find] Discovery interrupted");
    fatal = error instanceof Error && ["Adzuna could not complete this search. Please try again shortly.", "Could not check previously saved jobs. Please retry."].includes(error.message) ? error.message : "Search was interrupted. Saved jobs are retained. Reload before retrying.";
  } finally {
    if (summary.runId) {
      const failed = Boolean(fatal || (summary.failed && !summary.saved && summary.failed + summary.duplicates === summary.retrieved));
      try {
        const result = await client.database.from("agent_runs").update({ status: failed ? "failed" : "completed", jobs_found: summary.saved, completed_at: new Date().toISOString() }).eq("user_id", userId).eq("id", summary.runId).select("id").maybeSingle();
        summary.finalized = !result.error && Boolean(result.data);
      } catch { console.error("[agent/find] Could not finalize search"); }
      await logRun(client, userId, summary, failed ? "error" : summary.failed || !summary.finalized ? "warning" : "success");
    }
    if (events.length) await captureDiscoveryEvents(userId, events);
  }
  if (fatal) return { success: false, data: summary, error: fatal };
  return { success: true, data: summary };
}
