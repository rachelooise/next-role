import "server-only";
import { createInsforgeServer } from "@/lib/insforge-server";
import { parseProfile } from "@/lib/profile";
import { canDiscover, parseJobListing, JOB_LIST_COLUMNS, JOB_WINDOW, type JobListing } from "@/lib/job-discovery";

export type JobsPageData = { jobs: JobListing[]; total: number; ready: boolean; error: string | null };

export async function loadJobs(userId: string): Promise<JobsPageData> {
  try {
    const client = await createInsforgeServer();
    const [jobs, profile] = await Promise.all([
      client.database.from("jobs").select(JOB_LIST_COLUMNS, { count: "exact" }).eq("user_id", userId).order("found_at", { ascending: false }).order("id", { ascending: false }).range(0, JOB_WINDOW - 1),
      client.database.from("profiles").select("*").eq("id", userId).maybeSingle(),
    ]);
    if (jobs.error || profile.error) throw new Error("Load failed");
    return { jobs: (jobs.data ?? []).map(parseJobListing), total: jobs.count ?? jobs.data?.length ?? 0, ready: canDiscover(profile.data ? parseProfile(profile.data) : null), error: null };
  } catch {
    console.error("[jobs/load] Could not load saved jobs");
    return { jobs: [], total: 0, ready: false, error: "Could not load your saved jobs and profile. Please reload to try again." };
  }
}
