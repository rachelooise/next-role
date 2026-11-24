import type { ProfileInput } from "@/lib/profile";

export type ResumeContent = { summary: string; roles: { bullets: string[] }[] };
export type ResumeSource = Pick<ProfileInput, "current_title" | "years_experience" | "skills" | "work_experience" | "education">;

export function resumeSource(profile: ProfileInput): ResumeSource {
  return { current_title: profile.current_title, years_experience: profile.years_experience, skills: profile.skills, work_experience: profile.work_experience, education: profile.education };
}

export function validateResumeContent(value: unknown, profile: ResumeSource): ResumeContent {
  if (!value || typeof value !== "object" || !("summary" in value) || !("roles" in value)) throw new Error("Invalid resume content");
  const summary = value.summary;
  if (typeof summary !== "string" || !summary.trim() || summary.length > 650) throw new Error("Invalid summary");
  if (!Array.isArray(value.roles) || value.roles.length !== profile.work_experience.length) throw new Error("Invalid roles");
  const roles = value.roles.map((role: unknown, index: number): { bullets: string[] } => {
    if (!role || typeof role !== "object" || !("bullets" in role) || !Array.isArray(role.bullets) || role.bullets.length > 3) throw new Error("Invalid bullets");
    const bullets = role.bullets.map((bullet: unknown): string => {
      if (typeof bullet !== "string" || !bullet.trim() || bullet.length > 230) throw new Error("Invalid bullet");
      return bullet.trim();
    });
    if (Boolean(profile.work_experience[index].responsibilities.trim()) !== Boolean(bullets.length)) throw new Error("Missing or invented responsibilities");
    return { bullets };
  });
  return { summary: summary.trim(), roles };
}
