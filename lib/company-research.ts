import { z } from "zod";
import type { CompanyResearch } from "@/types/database";

export const RESEARCH_TASK_ID = "nextrole-company-research";
export const RESEARCH_STATES = ["idle", "queued", "running", "completed", "failed"] as const;
export type ResearchStatus = typeof RESEARCH_STATES[number];
export type ResearchState = {
  status: ResearchStatus;
  dossier: CompanyResearch | null;
  researchedAt: string | null;
  error: string | null;
};
export type ResearchPayload = { userId: string; jobId: string; requestId: string };
export const researchPayloadSchema = z.object({ userId: z.uuid(), jobId: z.uuid(), requestId: z.uuid() }).strict();
export const researchRequestSchema = z.object({ jobId: z.uuid() }).strict();

const paragraph = z.string().trim().min(1).max(3000);
const items = z.array(z.string().trim().min(1).max(700)).max(12);
export const dossierSchema = z.object({
  companyOverview: paragraph,
  techStack: items,
  culture: items,
  whyThisRole: paragraph,
  yourEdge: items.min(1),
  gapsToAddress: items.min(1),
  smartQuestions: items.min(1),
  interviewPrep: items.min(1),
  sources: z.array(z.string().url().max(2048).refine(value => {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  })).max(5),
  researchBasis: z.enum(["website", "job_profile"]).optional(),
  limitations: z.string().max(1000).optional(),
}).strict();

export const RESEARCH_COLUMNS = "company_research,company_researched_at,company_research_status,company_research_request_id,company_research_run_id,company_research_requested_at";
export const RESEARCH_FAILURE = "Research could not be completed. Please try again.";
export const researchStateSchema = z.object({
  status: z.enum(RESEARCH_STATES), dossier: dossierSchema.nullable(),
  researchedAt: z.iso.datetime({ offset: true }).nullable(), error: z.string().max(250).nullable(),
});

export function publicResearchState(row: Record<string, unknown>): ResearchState {
  const parsed = dossierSchema.safeParse(row.company_research);
  const status = z.enum(RESEARCH_STATES).safeParse(row.company_research_status);
  return {
    status: status.success ? status.data : parsed.success ? "completed" : "idle",
    dossier: parsed.success ? parsed.data : null,
    researchedAt: typeof row.company_researched_at === "string" ? row.company_researched_at : null,
    error: status.success && status.data === "failed" ? RESEARCH_FAILURE : null,
  };
}

export function isResearchActive(status: ResearchStatus): boolean {
  return status === "queued" || status === "running";
}
