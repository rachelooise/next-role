import "server-only";
import { createInsforgeServer } from "@/lib/insforge-server";
import { parseDashboardStats, type DashboardStatsResult } from "@/lib/dashboard-stats";

export async function loadDashboardStats(): Promise<DashboardStatsResult> {
  try {
    const client = await createInsforgeServer();
    // The database derives ownership from auth.uid(); no caller-supplied owner or admin client.
    const { data, error } = await client.database.rpc("dashboard_stats");
    if (error) throw new Error("Statistics query failed");
    return { stats: parseDashboardStats(data), error: null };
  } catch {
    console.error("[dashboard/stats] Could not load job statistics");
    return { stats: null, error: "Could not load your job statistics. Reload the dashboard to try again." };
  }
}
