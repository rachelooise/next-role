import "server-only";
import { randomUUID } from "node:crypto";
import type { InsForgeClient } from "@insforge/sdk";
import { runs, tasks } from "@trigger.dev/sdk";
import { RESEARCH_COLUMNS, RESEARCH_TASK_ID, isResearchActive, publicResearchState, type ResearchState } from "@/lib/company-research";

type ResearchRow = Record<string, unknown>;
const terminal = new Set(["COMPLETED", "FAILED", "CANCELED", "CRASHED", "INTERRUPTED", "SYSTEM_FAILURE", "EXPIRED", "TIMED_OUT"]);

async function ownedResearch(client: InsForgeClient, userId: string, jobId: string): Promise<ResearchRow | null> {
  const result = await client.database.from("jobs").select(RESEARCH_COLUMNS).eq("user_id", userId).eq("id", jobId).maybeSingle();
  if (result.error) throw new Error("Could not load company research");
  return result.data;
}

async function markStopped(client: InsForgeClient, userId: string, jobId: string, requestId: unknown, statuses: string[]): Promise<void> {
  if (typeof requestId !== "string") return;
  const saved = await client.database.from("jobs").update({ company_research_status: "failed" })
    .eq("user_id", userId).eq("id", jobId).eq("company_research_request_id", requestId).in("company_research_status", statuses);
  if (saved.error) throw new Error("Could not record research status");
}

export async function readResearch(client: InsForgeClient, userId: string, jobId: string): Promise<ResearchState | null> {
  let row = await ownedResearch(client, userId, jobId);
  if (!row) return null;
  if (isResearchActive(publicResearchState(row).status)) {
    let stopped = false;
    if (typeof row.company_research_run_id === "string" && process.env.TRIGGER_SECRET_KEY) {
      try { stopped = terminal.has((await runs.retrieve(row.company_research_run_id, { retry: { maxAttempts: 1 } })).status); }
      catch { console.error("[research/status] Could not check task service"); }
    }
    const age = typeof row.company_research_requested_at === "string" ? Date.now() - Date.parse(row.company_research_requested_at) : 0;
    // Queue TTL is one hour, execution is four minutes. Recover orphaned states later.
    if (stopped || age > 70 * 60 * 1000) {
      await markStopped(client, userId, jobId, row.company_research_request_id, ["queued", "running"]);
      row = await ownedResearch(client, userId, jobId);
    }
  }
  return row ? publicResearchState(row) : null;
}

export async function queueResearch(client: InsForgeClient, userId: string, jobId: string): Promise<ResearchState | null> {
  const existing = await readResearch(client, userId, jobId);
  if (!existing || isResearchActive(existing.status)) return existing;
  const requestId = randomUUID();
  const claim = await client.database.from("jobs").update({ company_research_status: "queued", company_research_request_id: requestId, company_research_run_id: null, company_research_requested_at: new Date().toISOString() })
    .eq("user_id", userId).eq("id", jobId).in("company_research_status", ["idle", "completed", "failed"]).select(RESEARCH_COLUMNS).maybeSingle();
  if (claim.error) throw new Error("Could not queue research");
  if (!claim.data) return readResearch(client, userId, jobId);
  try {
    const handle = await tasks.trigger(RESEARCH_TASK_ID, { userId, jobId, requestId }, { idempotencyKey: requestId, idempotencyKeyTTL: "24h", ttl: "1h", maxAttempts: 1 }, { retry: { maxAttempts: 1 } });
    const saved = await client.database.from("jobs").update({ company_research_run_id: handle.id })
      .eq("user_id", userId).eq("id", jobId).eq("company_research_request_id", requestId);
    if (saved.error) console.error("[research/queue] Could not record task handle");
  } catch {
    // A late accepted task cannot claim a failed or superseded request.
    await markStopped(client, userId, jobId, requestId, ["queued"]);
    console.error("[research/queue] Could not confirm task dispatch");
    throw new Error("Could not confirm research dispatch");
  }
  return readResearch(client, userId, jobId);
}
