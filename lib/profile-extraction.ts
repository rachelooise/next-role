import { parseProfile, type ProfileInput } from "@/lib/profile";

export function emptyProfile(): ProfileInput {
  return parseProfile({ skills: [], industries: [], work_experience: [], job_titles_seeking: [], preferred_locations: [] });
}

function normalizeResumeUrl(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  // Resumes commonly omit the protocol from printed website links.
  if (/^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#]|$)/i.test(trimmed)) return `https://${trimmed}`;
  return value;
}

export function validateExtraction(value: unknown): ProfileInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid extracted details.");
  // Runtime object narrowing; parseProfile validates each whitelisted property.
  const data = value as Record<string, unknown>;
  const result = parseProfile({ ...emptyProfile(), ...data, linkedin_url: normalizeResumeUrl(data.linkedin_url), portfolio_url: normalizeResumeUrl(data.portfolio_url) });
  if (result.education?.degree && !["High School", "Associate", "Bachelor's", "Master's", "Doctorate", "Other"].includes(result.education.degree)) throw new Error("Invalid extracted degree.");
  if (!Object.values(result).some((item) => Array.isArray(item) ? item.length > 0 : typeof item === "object" ? item !== null && Object.values(item).some((value) => value !== null && value !== "") : item !== null && item !== "")) throw new Error("No profile details found.");
  return result;
}

export function mergeExtraction(current: ProfileInput, extracted: ProfileInput): ProfileInput {
  const merged = { ...current };
  for (const key of ["full_name", "phone", "location", "linkedin_url", "portfolio_url", "current_title", "salary_expectation"] as const) {
    if (extracted[key]) merged[key] = extracted[key];
  }
  if (extracted.work_authorization) merged.work_authorization = extracted.work_authorization;
  if (extracted.experience_level) merged.experience_level = extracted.experience_level;
  if (extracted.years_experience !== null) merged.years_experience = extracted.years_experience;
  if (extracted.remote_preference) merged.remote_preference = extracted.remote_preference;
  for (const key of ["skills", "industries", "job_titles_seeking", "preferred_locations"] as const) merged[key] = [...current[key], ...extracted[key]];
  if (extracted.work_experience.length) merged.work_experience = extracted.work_experience;
  if (extracted.education) {
    const original = current.education;
    merged.education = {
      degree: extracted.education.degree || original?.degree || "",
      field_of_study: extracted.education.field_of_study || original?.field_of_study || "",
      institution: extracted.education.institution || original?.institution || "",
      graduation_year: extracted.education.graduation_year ?? original?.graduation_year ?? null,
    };
  }
  return parseProfile(merged);
}

export function readProfileFields(fields: FormData, roles: number[]): ProfileInput {
  const value = (name: string): string => String(fields.get(name) ?? "");
  const number = (name: string): number | null => value(name) === "" ? null : Number(value(name));
  const split = (name: string): string[] => value(name).split(",").map((item) => item.trim()).filter(Boolean);
  return parseProfile({
    ...Object.fromEntries(["full_name", "phone", "location", "linkedin_url", "portfolio_url", "work_authorization", "current_title", "experience_level", "remote_preference", "salary_expectation"].map((name) => [name, value(name)])),
    years_experience: number("years_experience"), skills: JSON.parse(value("skills")), industries: JSON.parse(value("industries")),
    job_titles_seeking: split("job_titles_seeking"), preferred_locations: split("preferred_locations"),
    education: { degree: value("degree"), field_of_study: value("field_of_study"), institution: value("institution"), graduation_year: number("graduation_year") },
    work_experience: roles.map((id) => ({ company: value(`role.${id}.company`), job_title: value(`role.${id}.job_title`), start_date: value(`role.${id}.start_date`), end_date: value(`role.${id}.end_date`), is_current: fields.has(`role.${id}.is_current`), responsibilities: value(`role.${id}.responsibilities`) })),
  });
}
