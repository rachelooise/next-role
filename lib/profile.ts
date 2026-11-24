import type { Education, Profile, WorkExperience } from "@/types/database";

export const MAX_RESUME_SIZE = 5 * 1024 * 1024;
export type ProfileInput = Pick<Profile, "full_name" | "phone" | "location" | "linkedin_url" | "portfolio_url" | "work_authorization" | "current_title" | "experience_level" | "years_experience" | "skills" | "industries" | "work_experience" | "education" | "job_titles_seeking" | "remote_preference" | "salary_expectation" | "preferred_locations">;
export type Completion = Pick<Profile, "is_complete" | "completion_percentage" | "missing_fields">;
export type SaveResult = { success: boolean; error?: string; completion?: Completion; updatedAt?: string; hasResume?: boolean; becameComplete?: boolean };

export function getCompletion(input: ProfileInput, email: string): Completion {
  const requirements: [string, boolean][] = [
    ["Full name", Boolean(input.full_name)], ["Email", Boolean(email)],
    ["Location", Boolean(input.location)], ["Work authorization", Boolean(input.work_authorization)],
    ["Current title", Boolean(input.current_title)], ["Experience level", Boolean(input.experience_level)],
    ["Years of experience", input.years_experience !== null], ["Skills", input.skills.length > 0],
    ["Job titles seeking", input.job_titles_seeking.length > 0], ["Remote preference", Boolean(input.remote_preference)],
  ];
  const missing_fields = requirements.filter(([, complete]) => !complete).map(([name]) => name);
  return { missing_fields, completion_percentage: (requirements.length - missing_fields.length) * 10, is_complete: missing_fields.length === 0 };
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid profile details.");
  return value as Record<string, unknown>; // Narrowed to a non-array object for runtime validation.
}
function text(value: unknown, limit: number = 300): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > limit) throw new Error(`Text fields must be ${limit} characters or fewer.`);
  return value.trim() || null;
}
function choice<T extends string>(value: unknown, options: readonly T[]): T | null {
  if (value === "" || value === null || value === undefined) return null;
  const selected = options.find((option) => option === value);
  if (!selected) throw new Error("Please choose a valid dropdown option.");
  return selected;
}
function integer(value: unknown, max: number): number | null {
  if (value === "" || value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > max) throw new Error("Please enter a valid whole number.");
  return value;
}
function list(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 100) throw new Error("Please use at most 100 tags or list items.");
  const values = value.map((item: unknown) => text(item, 100)).filter((item): item is string => Boolean(item));
  return values.filter((item, index) => values.findIndex((other) => other.toLowerCase() === item.toLowerCase()) === index);
}
function url(value: unknown): string | null {
  const result = text(value, 2000);
  if (!result) return null;
  try { const parsed = new URL(result); if (["https:", "http:"].includes(parsed.protocol)) return result; } catch { /* Return a field-specific message below. */ }
  throw new Error("Links must be valid http or https URLs.");
}
function month(value: unknown): string {
  const result = text(value);
  if (!result) return "";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(result)) throw new Error("Please enter valid work dates.");
  return result;
}
export function parseProfile(value: unknown): ProfileInput {
  const data = record(value);
  if (!Array.isArray(data.work_experience) || data.work_experience.length > 3) throw new Error("Add at most three work roles.");
  const work_experience: WorkExperience[] = data.work_experience.map((item: unknown) => {
    const role = record(item);
    if (typeof role.is_current !== "boolean") throw new Error("Please check your work role details.");
    const start_date = month(role.start_date);
    const end_date = role.is_current ? null : month(role.end_date) || null;
    if (start_date && end_date && end_date < start_date) throw new Error("End dates must follow start dates.");
    return { company: text(role.company) ?? "", job_title: text(role.job_title) ?? "", start_date, end_date, is_current: role.is_current, responsibilities: text(role.responsibilities, 10000) ?? "" };
  });
  let education: Education | null = null;
  if (data.education !== null && data.education !== undefined) {
    const item = record(data.education);
    education = { degree: text(item.degree) ?? "", field_of_study: text(item.field_of_study) ?? "", institution: text(item.institution) ?? "", graduation_year: integer(item.graduation_year, 9999) };
    if (education.graduation_year !== null && education.graduation_year < 1900) throw new Error("Please enter a four-digit graduation year.");
  }
  return {
    full_name: text(data.full_name), phone: text(data.phone, 100), location: text(data.location),
    linkedin_url: url(data.linkedin_url), portfolio_url: url(data.portfolio_url),
    work_authorization: choice(data.work_authorization, ["citizen", "permanent_resident", "visa_required"]),
    current_title: text(data.current_title), experience_level: choice(data.experience_level, ["junior", "mid", "senior", "lead"]),
    years_experience: integer(data.years_experience, 100), skills: list(data.skills), industries: list(data.industries),
    work_experience, education, job_titles_seeking: list(data.job_titles_seeking),
    remote_preference: choice(data.remote_preference, ["remote", "onsite", "hybrid", "any"]),
    salary_expectation: text(data.salary_expectation), preferred_locations: list(data.preferred_locations),
  };
}
export async function validateResume(file: File): Promise<void> {
  if (!file.name.toLowerCase().endsWith(".pdf") || file.type !== "application/pdf" || file.size === 0 || file.size > MAX_RESUME_SIZE) throw new Error("Choose a nonempty PDF no larger than 5 MB.");
  if (await file.slice(0, 5).text() !== "%PDF-") throw new Error("This file does not appear to be a PDF.");
}
