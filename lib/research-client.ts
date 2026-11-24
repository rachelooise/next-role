import { researchStateSchema, type ResearchState } from "@/lib/company-research";

async function requestResearch(jobId: string, method: "GET" | "POST", signal?: AbortSignal): Promise<ResearchState> {
  const response = await fetch(method === "GET" ? `/api/agent/research?jobId=${encodeURIComponent(jobId)}` : "/api/agent/research", {
    method, cache: "no-store", credentials: "same-origin",
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
    ...(method === "POST" ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId }) } : {}),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Please sign in again to continue company research.");
    if (response.status === 404) throw new Error("This saved job is no longer available.");
    if (response.status === 422) throw new Error("Save at least one skill in Profile before researching a company.");
    const payload: unknown = await response.json().catch(() => null);
    if (payload && typeof payload === "object" && "error" in payload && payload.error === "Company research is not configured yet. Please try again later.") throw new Error(payload.error);
    throw new Error(method === "POST" ? "Could not confirm research started. Check its status before trying again." : "Could not check research. You can retry the status check below.");
  }
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object" || !("state" in payload)) throw new Error("Could not read the research response.");
  const parsed = researchStateSchema.safeParse(payload.state);
  if (!parsed.success) throw new Error("Could not read the research response.");
  return parsed.data;
}

export function startResearch(jobId: string): Promise<ResearchState> {
  return requestResearch(jobId, "POST");
}

export function checkResearch(jobId: string, signal?: AbortSignal): Promise<ResearchState> {
  return requestResearch(jobId, "GET", signal);
}
