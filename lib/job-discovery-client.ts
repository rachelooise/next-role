import { discoveryMessage, object, type JobSearch } from "@/lib/job-discovery";

export async function requestJobDiscovery(search: JobSearch): Promise<{ message: string; warning: boolean }> {
  let response: Response;
  let result: Record<string, unknown>;
  try {
    response = await fetch("/api/agent/find", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(search), signal: AbortSignal.timeout(185000) });
    result = object(await response.json());
  } catch { throw new Error("Search was interrupted. Reload to check saved jobs before retrying."); }
  if (!response.ok || result.success !== true) throw new Error(typeof result.error === "string" ? result.error : "Could not complete the search. Reload before retrying.");
  const data = object(result.data);
  for (const key of ["retrieved", "saved", "strong", "duplicates", "failed"]) if (typeof data[key] !== "number" || !Number.isInteger(data[key]) || data[key] < 0 || data[key] > 10) throw new Error("Search finished, but the result could not be read. Reload to check saved jobs.");
  if (typeof data.runId !== "string" || typeof data.finalized !== "boolean") throw new Error("Reload to check your saved jobs.");
  // Each field is checked above; retain the concrete result shape at the boundary.
  const summary = { retrieved: Number(data.retrieved), saved: Number(data.saved), strong: Number(data.strong), duplicates: Number(data.duplicates), failed: Number(data.failed), runId: data.runId, finalized: data.finalized };
  return { message: discoveryMessage(summary), warning: summary.failed > 0 || !summary.finalized };
}
