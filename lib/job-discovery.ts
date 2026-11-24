import type { ProfileInput } from "@/lib/profile";

export const COUNTRIES = [{ value: "us", label: "United States" }, { value: "gb", label: "United Kingdom" }, { value: "au", label: "Australia" }, { value: "ca", label: "Canada" }] as const;
export type Country = typeof COUNTRIES[number]["value"];
export type JobSearch = { jobTitle: string; location: string; country: Country };
export type JobMatch = { matchScore: number; matchReason: string; matchedSkills: string[]; missingSkills: string[] };
export type DiscoverySummary = { retrieved: number; saved: number; strong: number; duplicates: number; failed: number; runId: string; finalized: boolean };
export type JobListing = { id: string; title: string; company: string; location: string | null; salary: string | null; match_score: number; found_at: string; external_apply_url: string };
export const JOB_LIST_COLUMNS = "id,title,company,location,salary,match_score,found_at,external_apply_url";
export const JOB_WINDOW = 20;

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid data.");
  return value as Record<string, unknown>; // Runtime check excludes null, primitives and arrays.
}

export function parseJobSearch(value: unknown): JobSearch {
  const data = object(value);
  if (typeof data.jobTitle !== "string" || !data.jobTitle.trim() || data.jobTitle.length > 150) throw new Error("Enter a job title of 150 characters or fewer.");
  const location = data.location ?? "";
  if (typeof location !== "string" || location.length > 200) throw new Error("Enter a location of 200 characters or fewer.");
  const country = COUNTRIES.find((item) => item.value === (data.country ?? "us"))?.value;
  if (!country) throw new Error("Choose a supported country.");
  return { jobTitle: data.jobTitle.trim(), location: location.trim(), country };
}

export function canDiscover(profile: ProfileInput | null): boolean {
  return Boolean(profile && profile.skills.length && (profile.current_title || profile.job_titles_seeking.length));
}

function skillList(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 30 || value.some((item: unknown) => typeof item !== "string" || !item.trim() || item.length > 100)) throw new Error("Invalid skills.");
  return [...new Set(value.map((item: string) => item.trim()))];
}

export function validateJobMatch(value: unknown, profile: ProfileInput): JobMatch {
  const data = object(value);
  if (typeof data.matchScore !== "number" || !Number.isInteger(data.matchScore) || data.matchScore < 0 || data.matchScore > 100 || typeof data.matchReason !== "string" || !data.matchReason.trim() || data.matchReason.length > 2000) throw new Error("Invalid match result.");
  const matchedSkills = skillList(data.matchedSkills);
  const missingSkills = skillList(data.missingSkills);
  const owned = new Set(profile.skills.map((skill) => skill.toLowerCase()));
  if (matchedSkills.some((skill) => !owned.has(skill.toLowerCase())) || missingSkills.some((skill) => owned.has(skill.toLowerCase()))) throw new Error("Inconsistent match skills.");
  return { matchScore: data.matchScore, matchReason: data.matchReason.trim(), matchedSkills, missingSkills };
}

export function parseJobListing(value: unknown): JobListing {
  const data = object(value);
  if (typeof data.id !== "string" || typeof data.title !== "string" || typeof data.company !== "string" || typeof data.found_at !== "string" || !Number.isFinite(Date.parse(data.found_at)) || typeof data.match_score !== "number" || !Number.isInteger(data.match_score) || data.match_score < 0 || data.match_score > 100 || typeof data.external_apply_url !== "string" || !safeWebUrl(data.external_apply_url)) throw new Error("Invalid saved listing.");
  return { id: data.id, title: data.title, company: data.company, found_at: data.found_at, match_score: data.match_score, external_apply_url: data.external_apply_url, location: typeof data.location === "string" ? data.location : null, salary: typeof data.salary === "string" ? data.salary : null };
}

export function safeWebUrl(value: string): boolean {
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password; } catch { return false; }
}

export function discoveryMessage(summary: DiscoverySummary): string {
  if (!summary.retrieved) return "No jobs found. Try a different title or location.";
  let message = `Saved ${summary.saved} new ${summary.saved === 1 ? "job" : "jobs"}, including ${summary.strong} strong ${summary.strong === 1 ? "match" : "matches"}.`;
  if (summary.duplicates) message += ` ${summary.duplicates} already saved.`;
  if (summary.failed) message += ` ${summary.failed} could not be scored or saved.`;
  if (!summary.finalized) message += " Search status could not be updated. Saved jobs are retained; reload before retrying.";
  return message;
}
