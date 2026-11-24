import type { ReactElement } from "react";
import type { CompanyResearch } from "@/types/database";
import { DetailIcon } from "@/components/job-details/DetailIcon";

type Props = { dossier: CompanyResearch };

export function ResearchDossier({ dossier }: Props): ReactElement {
  const sections = [
    { label: "Culture", items: dossier.culture, icon: "people", tone: "text-info" },
    { label: "Your Edge", items: dossier.yourEdge, icon: "shield", tone: "text-success" },
    { label: "Gaps to Address", items: dossier.gapsToAddress, icon: "checklist", tone: "text-accent" },
    { label: "Smart Questions", items: dossier.smartQuestions, icon: "question", tone: "text-info" },
    { label: "Interview Prep", items: dossier.interviewPrep, icon: "message", tone: "text-success" },
  ] as const;
  return <div className="mt-5 space-y-6 break-words">
    <div className="rounded-lg border border-border bg-surface-secondary p-3 text-xs leading-5 text-text-secondary">
      <p className="font-medium text-text-primary">{dossier.researchBasis === "job_profile" ? "Limited briefing · saved job and profile only" : "Company briefing · AI generated"}</p>
      <p className="mt-1">{dossier.limitations || "Review the linked sources. Company statements and AI inferences may be incomplete."}</p>
    </div>
    <div className="rounded-2xl border border-border bg-surface-secondary p-4"><h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary"><DetailIcon name="compass" className="size-4 text-accent" />Company Overview</h3><p className="mt-3 whitespace-pre-line text-sm leading-6 text-text-primary">{dossier.companyOverview}</p></div>
    <div><h3 className="text-sm font-semibold text-text-primary">Tech Stack</h3>{dossier.techStack.length ? <ul className="mt-3 flex flex-wrap gap-2">{dossier.techStack.map((item, index) => <li key={`${index}-${item}`} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent-dark"><DetailIcon name="code" className="size-3" /><span className="min-w-0 break-words">{item}</span></li>)}</ul> : <p className="app-muted mt-2">Not established from the available evidence.</p>}</div>
    <div><h3 className="text-sm font-semibold text-text-primary">Why This Role</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-text-primary">{dossier.whyThisRole}</p></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {sections.map(section => <div key={section.label} className="min-w-0 rounded-2xl border border-border bg-surface-secondary p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary"><DetailIcon name={section.icon} className={`size-4 ${section.tone}`} />{section.label}</h3>
        {section.items.length ? <ul className="mt-3 list-disc space-y-2 pl-3 text-sm leading-6 text-text-primary marker:text-accent">{section.items.map((item, index) => <li key={`${index}-${item}`} className="pl-1">{item}</li>)}</ul> : <p className="app-muted mt-3">Not established from the available evidence.</p>}
      </div>)}
    </div>
    <div className="border-t border-border pt-4"><h3 className="text-sm font-semibold text-text-primary">Sources</h3>{dossier.sources.length ? <ul className="mt-2 space-y-2">{dossier.sources.map((source, index) => <li key={`${index}-${source}`}><a className="break-all text-xs text-accent underline underline-offset-2" href={source} target="_blank" rel="noopener noreferrer">{source}<span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul> : <p className="app-muted mt-2">No company website sources were verified. This briefing uses the saved job and professional profile.</p>}</div>
  </div>;
}
