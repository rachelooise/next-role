import type { ReactElement } from "react";

type Props = { percentage: number };

export function CompletionIndicator({ percentage }: Props): ReactElement {
  const value = Math.min(100, Math.max(0, percentage));

  return (
    <div
      className="relative flex size-16 shrink-0 items-center justify-center"
      role="progressbar"
      aria-label="Saved profile completion"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="10" className="text-border" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="10" pathLength="100" strokeDasharray={`${value} 100`} strokeLinecap="round" className="text-accent" />
      </svg>
      <span className="text-base font-semibold text-text-primary">{value}%</span>
    </div>
  );
}
