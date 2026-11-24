import type { InsForgeClient } from "@insforge/sdk";
import { researchPayloadSchema, type ResearchPayload } from "@/lib/company-research";
import { researchDatabase } from "@/lib/research-clients";
import { captureCompanyResearched } from "@/lib/research-analytics";
import { browseCompany } from "@/agent/company-browser";
import { loadResearchInputs, synthesizeResearch } from "@/agent/research-synthesis";

async function researchLog(client: InsForgeClient, payload: ResearchPayload, message: string, level: "info" | "warning" | "success" | "error"): Promise<void> {
  try {
    const saved = await client.database.from("agent_logs").insert([{ user_id: payload.userId, job_id: payload.jobId, message, level }]);
    if (saved.error) console.error("[research/log] Could not save activity");
  } catch { console.error("[research/log] Could not save activity"); }
}

export async function failResearch(payload: ResearchPayload, client: InsForgeClient = researchDatabase()): Promise<void> {
  const result = await client.database.from("jobs").update({ company_research_status: "failed" })
    .eq("user_id", payload.userId).eq("id", payload.jobId).eq("company_research_request_id", payload.requestId)
    .in("company_research_status", ["queued", "running"]);
  if (result.error) throw new Error("Could not save research failure");
}

export async function researchCompany(raw: ResearchPayload, client: InsForgeClient = researchDatabase()): Promise<{ success: boolean; skipped?: boolean }> {
  const payload = researchPayloadSchema.parse(raw);
  let phase = "claim";
  try {
    // Claim only this owned request. Replays and superseded tasks do no provider work.
    const claim = await client.database.from("jobs").update({ company_research_status: "running" })
      .eq("user_id", payload.userId).eq("id", payload.jobId).eq("company_research_request_id", payload.requestId)
      .eq("company_research_status", "queued").select("id").maybeSingle();
    if (claim.error) throw new Error("Could not claim research");
    if (!claim.data) return { success: true, skipped: true };
    await researchLog(client, payload, "Started company research.", "info");
    phase = "inputs";
    const { job, profile } = await loadResearchInputs(client, payload.userId, payload.jobId);
    phase = "browsing";
    const evidence = await browseCompany({ company: job.company, title: job.title, sourceUrl: job.source_url },
      message => researchLog(client, payload, message, "warning"));
    phase = "synthesis";
    const dossier = await synthesizeResearch(job, profile, evidence);
    phase = "persistence";
    const saved = await client.database.from("jobs").update({ company_research: dossier, company_researched_at: new Date().toISOString(), company_research_status: "completed" })
      .eq("user_id", payload.userId).eq("id", payload.jobId).eq("company_research_request_id", payload.requestId)
      .eq("company_research_status", "running").select("id").maybeSingle();
    if (saved.error) throw new Error("Could not persist company research");
    if (!saved.data) return { success: true, skipped: true };
    await researchLog(client, payload, evidence.pages.length ? `Researched ${job.company}.` : `Prepared a limited briefing for ${job.company} from the saved job and profile.`, "success");
    try { await captureCompanyResearched(payload.userId, payload.jobId, job.company); }
    catch { console.error("[research/worker] Analytics delivery failed"); }
    return { success: true };
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error && typeof error.status === "number" && Number.isInteger(error.status) && error.status >= 100 && error.status <= 599 ? error.status : null;
    const category = status ? `HTTP ${status}` : error instanceof SyntaxError ? "invalid JSON" : error && typeof error === "object" && "name" in error && error.name === "ZodError" ? "validation" : "unavailable";
    const failure = `Company research failed at ${phase} (${category}).`;
    console.error(`[research/worker] ${failure}`);
    try { await failResearch(payload, client); } catch { console.error("[research/worker] Could not persist failure"); }
    await researchLog(client, payload, `${failure} Please retry.`, "error");
    return { success: false };
  }
}
