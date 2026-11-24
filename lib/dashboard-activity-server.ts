import "server-only";
import { createInsforgeServer } from "@/lib/insforge-server";
import { ACTIVITY_LIMIT, mergeDashboardActivity, type DashboardActivityResult } from "@/lib/dashboard-activity";

export async function loadDashboardActivity(userId: string): Promise<DashboardActivityResult> {
  try {
    const client = await createInsforgeServer();
    const now = Date.now(), cutoff = new Date(now).toISOString();
    const [runs, jobs] = await Promise.all([
      client.database.from("agent_runs").select("id,job_title_searched,jobs_found,completed_at")
        .eq("user_id", userId).eq("status", "completed").not("completed_at", "is", null).lte("completed_at", cutoff)
        .order("completed_at", { ascending: false }).order("id", { ascending: false }).limit(ACTIVITY_LIMIT),
      client.database.from("jobs").select("id,company,company_researched_at")
        .eq("user_id", userId).not("company_research", "is", null).not("company_researched_at", "is", null).lte("company_researched_at", cutoff)
        .order("company_researched_at", { ascending: false }).order("id", { ascending: false }).limit(ACTIVITY_LIMIT),
    ]);
    if (runs.error || jobs.error || !Array.isArray(runs.data) || !Array.isArray(jobs.data)) throw new Error("Activity query failed");
    return { entries: mergeDashboardActivity(runs.data, jobs.data, now), error: null };
  } catch {
    console.error("[dashboard/activity] Could not load recent activity");
    return { entries: [], error: "Could not load recent activity. Please reload to try again." };
  }
}
