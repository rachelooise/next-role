import { task } from "@trigger.dev/sdk";
import { failResearch, researchCompany } from "@/agent/research";
import { RESEARCH_TASK_ID, researchPayloadSchema, type ResearchPayload } from "@/lib/company-research";

export const companyResearchTask = task({
  id: RESEARCH_TASK_ID,
  queue: { name: "company-research", concurrencyLimit: 1 },
  maxDuration: 240,
  retry: { maxAttempts: 1 },
  run: async (payload: ResearchPayload): Promise<{ success: boolean; skipped?: boolean }> => {
    const result = await researchCompany(researchPayloadSchema.parse(payload));
    if (!result.success) throw new Error("Company research could not be completed");
    return result;
  },
  onFailure: async ({ payload }): Promise<void> => {
    try { await failResearch(researchPayloadSchema.parse(payload)); }
    catch { console.error("[research/task] Could not record final task failure"); }
  },
});
