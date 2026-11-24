export const ACTIVITY_LIMIT = 5;
export type DashboardActivity = {
  id: string;
  message: string;
  occurredAt: string;
  time: string;
  tone: "info" | "success";
};
export type DashboardActivityResult = { entries: DashboardActivity[]; error: string | null };

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid activity");
  return { ...value };
}

function text(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("Missing activity details");
  return value.trim();
}

function timestamp(value: unknown): string {
  const result = text(value);
  if (!Number.isFinite(Date.parse(result))) throw new Error("Invalid activity timestamp");
  return new Date(result).toISOString();
}

export function activityTime(occurredAt: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(occurredAt)) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

export function mergeDashboardActivity(runs: unknown[], jobs: unknown[], now: number): DashboardActivity[] {
  const searches: DashboardActivity[] = runs.map((value: unknown): DashboardActivity => {
    const row = record(value);
    if (typeof row.jobs_found !== "number" || !Number.isSafeInteger(row.jobs_found) || row.jobs_found < 0) throw new Error("Invalid job count");
    const occurredAt = timestamp(row.completed_at);
    return { id: `search:${text(row.id)}`, message: `Found ${row.jobs_found} ${row.jobs_found === 1 ? "job" : "jobs"} for ${text(row.job_title_searched)}`, occurredAt, time: activityTime(occurredAt, now), tone: "success" };
  });
  const research: DashboardActivity[] = jobs.map((value: unknown): DashboardActivity => {
    const row = record(value);
    const occurredAt = timestamp(row.company_researched_at);
    return { id: `research:${text(row.id)}`, message: `Researched ${text(row.company)}`, occurredAt, time: activityTime(occurredAt, now), tone: "info" };
  });
  return [...searches, ...research]
    .filter((entry) => Date.parse(entry.occurredAt) <= now)
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt) || b.id.localeCompare(a.id))
    .slice(0, ACTIVITY_LIMIT);
}
