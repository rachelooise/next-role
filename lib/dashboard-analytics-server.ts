import "server-only";
import { requireAuthUser } from "@/lib/auth";

export type AnalyticsPoint = { label: string; value: number };
export type AnalyticsChart = { points: AnalyticsPoint[]; error: boolean };
export type DashboardAnalytics = { jobs: AnalyticsChart; research: AnalyticsChart; scores: AnalyticsChart };

const failed = (): AnalyticsChart => ({ points: [], error: true });

export async function loadDashboardAnalytics(): Promise<DashboardAnalytics> {
  const user = await requireAuthUser();
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  const project = process.env.POSTHOG_PROJECT_ID;
  const host = process.env.POSTHOG_API_HOST;
  if (!key || !project || !/^\d+$/.test(project) || !host || !/^[a-f\d-]{36}$/i.test(user.id)) {
    console.error("[dashboard/analytics] Invalid or missing server configuration or user ID", { keyPresent: !!key, projectValid: !!project && /^\d+$/.test(project), hostPresent: !!host, userIdValid: /^[a-f\d-]{36}$/i.test(user.id) });
    return { jobs: failed(), research: failed(), scores: failed() };
  }

  async function query(sql: string): Promise<unknown[][]> {
    const url = new URL(`/api/projects/${project}/query/`, host);
    if (url.protocol !== "https:") throw new Error("Invalid analytics host");
    const response = await fetch(url, { method: "POST", cache: "no-store", signal: AbortSignal.timeout(8000), headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: { kind: "HogQLQuery", query: sql } }) });
    if (!response.ok) throw new Error(`Analytics query failed (${response.status})`);
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || !("results" in body) || !Array.isArray(body.results)) throw new Error("Invalid analytics response");
    return body.results as unknown[][];
  }
  const owner = user.id;
  async function daily(event: string, days: number): Promise<AnalyticsChart> {
    try {
      const rows = await query(`SELECT toDate(timestamp), count() FROM events WHERE event = '${event}' AND distinct_id = '${owner}' AND timestamp >= toStartOfDay(now(), 'UTC') - INTERVAL ${days - 1} DAY AND timestamp < toStartOfDay(now(), 'UTC') + INTERVAL 1 DAY GROUP BY toDate(timestamp) ORDER BY toDate(timestamp)`);
      const counts = new Map<string, number>();
      for (const row of rows) { const date = String(row[0]).slice(0, 10); const count = Number(row[1]); if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isSafeInteger(count) || count < 0) throw new Error("Invalid result"); counts.set(date, count); }
      const today = new Date(); today.setUTCHours(0, 0, 0, 0);
      return { error: false, points: Array.from({ length: days }, (_, i) => { const date = new Date(today.getTime() - (days - 1 - i) * 86400000); const label = date.toISOString().slice(0, 10); return { label, value: counts.get(label) ?? 0 }; }) };
    } catch (error) { console.error("[dashboard/analytics] Daily query failed", error instanceof Error ? error.message : "unknown error"); return failed(); }
  }
  async function scores(): Promise<AnalyticsChart> {
    try {
      const rows = await query(`SELECT toFloatOrNull(toString(properties.matchScore)), count() FROM events WHERE event = 'job_found' AND distinct_id = '${owner}' GROUP BY toFloatOrNull(toString(properties.matchScore)) LIMIT 1000`);
      const points = ["0–49", "50–59", "60–69", "70–79", "80–89", "90–100"].map(label => ({ label, value: 0 }));
      for (const row of rows) { if (row[0] === null) continue; const score = Number(row[0]), count = Number(row[1]); if (!Number.isFinite(score) || !Number.isSafeInteger(count) || count < 0) throw new Error("Invalid result"); if (score < 0 || score > 100) continue; points[score < 50 ? 0 : Math.min(5, Math.floor(score / 10) - 4)].value += count; }
      return { points, error: false };
    } catch (error) { console.error("[dashboard/analytics] Score query failed", error instanceof Error ? error.message : "unknown error"); return failed(); }
  }
  const [jobs, research, distribution] = await Promise.all([daily("job_found", 30), daily("company_researched", 7), scores()]);
  return { jobs, research, scores: distribution };
}
