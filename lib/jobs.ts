import "server-only";
import { createInsforgeServer } from "@/lib/insforge-server";
import { parseProfile } from "@/lib/profile";
import { canDiscover, parseJobListing, JOB_LIST_COLUMNS, type JobListing } from "@/lib/job-discovery";
import { JOB_PAGE_SIZE, type JobFilters } from "@/lib/job-filters";
import { MATCH_THRESHOLD } from "@/lib/utils";

export type JobsPageData = { jobs: JobListing[]; total: number; ready: boolean; error: string | null };

export async function loadJobs(userId: string, filters: JobFilters): Promise<JobsPageData> {
  try {
    const client = await createInsforgeServer();
    let query = client.database.from("jobs").select(JOB_LIST_COLUMNS, { count: "exact" }).eq("user_id", userId);
    if (filters.match === "high") query = query.gte("match_score", MATCH_THRESHOLD);
    if (filters.match === "low") query = query.lt("match_score", MATCH_THRESHOLD);
    if (filters.query.trim()) {
      const term = filters.query.trim().replace(/[\\%_]/g, "\\$&").replace(/"/g, '\\"');
      query = query.or(`company.ilike."%${term}%",title.ilike."%${term}%"`);
    }
    const start = (filters.page - 1) * JOB_PAGE_SIZE;
    query = query.order(filters.sort === "score" ? "match_score" : "found_at", { ascending: filters.sort === "oldest" }).order("id", { ascending: false }).range(start, start + JOB_PAGE_SIZE - 1);
    const [jobs, profile] = await Promise.all([
      query,
      client.database.from("profiles").select("*").eq("id", userId).maybeSingle(),
    ]);
    if (jobs.error || profile.error) throw new Error("Load failed");
    return { jobs: (jobs.data ?? []).map(parseJobListing), total: jobs.count ?? jobs.data?.length ?? 0, ready: canDiscover(profile.data ? parseProfile(profile.data) : null), error: null };
  } catch {
    console.error("[jobs/load] Could not load saved jobs");
    return { jobs: [], total: 0, ready: false, error: "Could not load your saved jobs and profile. Please reload to try again." };
  }
}
