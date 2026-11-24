import type { ReactElement } from "react";
import { CompletionIndicator } from "@/components/profile/CompletionIndicator";
import type { Completion } from "@/lib/profile";

type Props = { completion: Completion };

export function ProfileAttention({ completion }: Props): ReactElement {
  return (
    <section className="app-card flex items-center justify-between gap-4" aria-labelledby="profile-attention-heading">
      <div className="min-w-0">
        <h2 id="profile-attention-heading" className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <span aria-hidden="true" className={`flex size-4 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${completion.is_complete ? "bg-success-lightest text-success-foreground" : "bg-warning text-warning-foreground"}`}>{completion.is_complete ? "✓" : "!"}</span>
          {completion.is_complete ? "Profile complete" : "Profile needs attention"}
        </h2>
        <p className="app-muted mt-2">{completion.is_complete ? "Your saved profile is ready for job matching." : "Complete these fields and save your profile to get ready for job matching."}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {completion.missing_fields.map((label) => (
            <span key={label} className="rounded-sm bg-warning px-2 py-0.5 text-xs font-medium uppercase text-warning-foreground">{label}</span>
          ))}
        </div>
      </div>
      <CompletionIndicator percentage={completion.completion_percentage} />
    </section>
  );
}
