import type { ReactElement } from "react";
import type { JobDetails } from "@/lib/job-details";
import { DetailIcon } from "@/components/job-details/DetailIcon";

type Props = { job: JobDetails };
export function MatchScore({ job }: Props): ReactElement {
  return <>
    <section className="app-card" aria-labelledby="reason-heading"><h2 id="reason-heading" className="flex items-center gap-3 text-xs font-semibold uppercase text-text-secondary"><span className="flex size-7 items-center justify-center rounded-xl bg-success-lightest text-success"><DetailIcon name="sparkles" className="size-4" /></span>AI Match Reasoning</h2><p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed">{job.match_reason || "No match reasoning was saved for this job."}</p></section>
    <section className="app-card" aria-labelledby="skills-heading"><h2 id="skills-heading" className="text-xs font-semibold uppercase text-text-secondary">Required Skills vs Your Profile</h2><div className="mt-4 space-y-3">{[{ label: "You have", skills: job.matched_skills, mark: "✓", color: "bg-success-lightest text-success-foreground", empty: "No matched skills recorded." }, { label: "Gap skills", skills: job.missing_skills, mark: "×", color: "bg-accent-muted text-accent", empty: "No skill gaps recorded." }].map((group) => <div key={group.label}><h3 className="app-muted mb-2">{group.label}</h3><ul className="flex flex-wrap gap-2">{group.skills.length ? group.skills.map((skill, index) => <li key={`${skill}-${index}`} className={`inline-flex max-w-full items-start gap-1 rounded-full px-3 py-1 text-xs font-medium ${group.color}`}><span aria-hidden="true">{group.mark}</span><span className="break-words [overflow-wrap:anywhere]">{skill}</span></li>) : <li className="app-muted">{group.empty}</li>}</ul></div>)}</div></section>
  </>;
}
