import { object, parseJobListing, type JobListing } from "@/lib/job-discovery";
import { publicResearchState, RESEARCH_COLUMNS, type ResearchState } from "@/lib/company-research";

export type JobDetails = JobListing & {
  job_type: string | null; about_role: string | null; about_company: string | null;
  match_reason: string | null; matched_skills: string[]; missing_skills: string[];
  responsibilities: string[]; requirements: string[]; nice_to_have: string[]; benefits: string[];
  research: ResearchState;
};
export const JOB_DETAILS_COLUMNS = `id,title,company,location,salary,match_score,found_at,external_apply_url,job_type,about_role,about_company,match_reason,matched_skills,missing_skills,responsibilities,requirements,nice_to_have,benefits,${RESEARCH_COLUMNS}`;

export function parseJobDetails(value: unknown): JobDetails {
  const row = object(value);
  function text(key: string): string | null { return typeof row[key] === "string" && row[key].trim() ? row[key] : null; }
  function list(key: string): string[] {
    const items = row[key];
    return Array.isArray(items) ? items.filter((item: unknown): item is string => typeof item === "string" && Boolean(item.trim())) : [];
  }
  return { ...parseJobListing(value), job_type: text("job_type"), about_role: text("about_role"), about_company: text("about_company"), match_reason: text("match_reason"), matched_skills: list("matched_skills"), missing_skills: list("missing_skills"), responsibilities: list("responsibilities"), requirements: list("requirements"), nice_to_have: list("nice_to_have"), benefits: list("benefits"), research: publicResearchState(row) };
}

export function dateFoundLabel(foundAt: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(foundAt)) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(foundAt));
}
