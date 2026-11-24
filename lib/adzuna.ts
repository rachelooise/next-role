import "server-only";
import { object, safeWebUrl, type Country, type JobSearch } from "@/lib/job-discovery";

export type AdzunaJob = { id: string; title: string; company: string; location: string | null; description: string; redirectUrl: string; salary: string | null; jobType: string | null };

export function adzunaCredentials(): { appId: string; appKey: string } | null {
  const appId = process.env.ADZUNA_APP_ID || process.env.AZUNA_API_ID;
  const appKey = process.env.ADZUNA_APP_KEY || process.env.AZUNA_API_KEY;
  return appId && appKey ? { appId, appKey } : null;
}

function required(value: unknown, limit: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > limit) throw new Error("Invalid provider field.");
  return value.trim();
}

function salary(data: Record<string, unknown>, country: Country): string | null {
  const amounts = [data.salary_min, data.salary_max].map((value) => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null);
  const currency = { us: "USD", gb: "GBP", au: "AUD", ca: "CAD" }[country];
  const format = (value: number): string => `${currency} ${Math.round(value).toLocaleString("en-US")}`;
  const [min, max] = amounts;
  if (!min && !max) return null;
  const label = min && max && min !== max ? `${format(min)} – ${format(max)}` : min ? `${format(min)}${max ? "" : "+"}` : `Up to ${format(max!)}`;
  return label + (data.salary_is_predicted === 1 || data.salary_is_predicted === "1" ? " (estimated)" : "");
}

export function parseAdzunaJob(value: unknown, country: Country): AdzunaJob {
  const data = object(value);
  const redirectUrl = required(data.redirect_url, 8000);
  if (!safeWebUrl(redirectUrl)) throw new Error("Invalid provider link.");
  const employment = [data.contract_time, data.contract_type].filter((item): item is string => typeof item === "string" && item.length < 80).map((item) => item.replaceAll("_", " "));
  return { id: required(data.id, 200), title: required(data.title, 500), company: required(object(data.company).display_name, 500), location: typeof object(data.location).display_name === "string" ? required(object(data.location).display_name, 1000) : null, description: required(data.description, 30000), redirectUrl, salary: salary(data, country), jobType: employment.join(" · ") || null };
}

export async function searchJobs(search: JobSearch): Promise<{ jobs: AdzunaJob[]; retrieved: number; invalid: number }> {
  const credentials = adzunaCredentials();
  if (!credentials) throw new Error("Job discovery is not configured. Please try again later.");
  const params = new URLSearchParams({ app_id: credentials.appId, app_key: credentials.appKey, what: search.jobTitle, category: "it-jobs", results_per_page: "10", "content-type": "application/json" });
  if (search.location) params.set("where", search.location);
  let data: Record<string, unknown>;
  try {
    const response = await fetch(`https://api.adzuna.com/v1/api/jobs/${search.country}/search/1?${params}`, { cache: "no-store", signal: AbortSignal.timeout(12000), headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Provider unavailable");
    data = object(await response.json());
    if (!Array.isArray(data.results)) throw new Error("Invalid provider response");
  } catch { throw new Error("Adzuna could not complete this search. Please try again shortly."); }
  const jobs: AdzunaJob[] = [];
  let invalid = 0;
  const results = Array.isArray(data.results) ? data.results.slice(0, 10) : [];
  for (const value of results) {
    try { jobs.push(parseAdzunaJob(value, search.country)); } catch { invalid++; }
  }
  return { jobs, retrieved: results.length, invalid };
}
