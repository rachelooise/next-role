import "server-only";
import { createInsforgeServer } from "@/lib/insforge-server";
import { JOB_DETAILS_COLUMNS, parseJobDetails, type JobDetails } from "@/lib/job-details";

type Result = { job: JobDetails | null; error: string | null; loadedAt: number };

export async function loadJobDetails(userId: string, id: string): Promise<Result> {
  const loadedAt = Date.now();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return { loadedAt, job: null, error: null };
  try {
    const client = await createInsforgeServer();
    const result = await client.database.from("jobs").select(JOB_DETAILS_COLUMNS).eq("user_id", userId).eq("id", id).maybeSingle();
    if (result.error) throw new Error("Load failed");
    return { loadedAt, job: result.data ? parseJobDetails(result.data) : null, error: null };
  } catch {
    console.error("[jobs/details] Could not load saved job");
    return { loadedAt, job: null, error: "Could not load this job. Please reload to try again." };
  }
}
