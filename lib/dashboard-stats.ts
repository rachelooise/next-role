export type DashboardStat = { label: string; value: string; trend?: string; subtitle: string };
export type DashboardStats = {
  totalJobs: number;
  averageMatchRate: number | null;
  companiesResearched: number;
  jobsThisWeek: number;
};
export type DashboardStatsResult = { stats: DashboardStats | null; error: string | null };

export function parseDashboardStats(value: unknown): DashboardStats {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid statistics");
  if (!("totalJobs" in value) || !("averageMatchRate" in value) || !("companiesResearched" in value) || !("jobsThisWeek" in value)) throw new Error("Missing statistics");
  const { totalJobs, averageMatchRate, companiesResearched, jobsThisWeek } = value;
  if (typeof totalJobs !== "number" || !Number.isSafeInteger(totalJobs) || totalJobs < 0
    || typeof companiesResearched !== "number" || !Number.isSafeInteger(companiesResearched) || companiesResearched < 0 || companiesResearched > totalJobs
    || typeof jobsThisWeek !== "number" || !Number.isSafeInteger(jobsThisWeek) || jobsThisWeek < 0 || jobsThisWeek > totalJobs
    || (averageMatchRate !== null && (typeof averageMatchRate !== "number" || !Number.isFinite(averageMatchRate) || averageMatchRate < 0 || averageMatchRate > 100))
    || (totalJobs === 0 ? averageMatchRate !== null : averageMatchRate === null)) throw new Error("Invalid statistics");
  return { totalJobs, averageMatchRate, companiesResearched, jobsThisWeek };
}

export function formatDashboardStats(stats: DashboardStats | null): DashboardStat[] {
  const count = (value: number | undefined): string => value === undefined ? "—" : value.toLocaleString("en-US");
  return [
    { label: "Total Jobs Found", value: count(stats?.totalJobs), subtitle: "All saved jobs" },
    { label: "Avg. Match Rate", value: stats?.averageMatchRate == null ? "—" : `${Math.round(stats.averageMatchRate)}%`, subtitle: stats?.totalJobs === 0 ? "No scored jobs yet" : "Across all saved jobs" },
    { label: "Companies Researched", value: count(stats?.companiesResearched), subtitle: "Total researched" },
    { label: "Jobs This Week", value: count(stats?.jobsThisWeek), subtitle: "Last 7 days" },
  ];
}
