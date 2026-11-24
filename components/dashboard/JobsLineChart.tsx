import { useId, type ReactElement } from "react";
import type { ChartPoint } from "@/lib/dashboard-preview";

type Props = { points: ChartPoint[] };

export function JobsLineChart({ points }: Props): ReactElement {
  const id = useId();
  const titleId = `${id}-title`, gradientId = `${id}-fill`;
  const maximum = Math.max(4, Math.ceil(Math.max(...points.map(point => point.value)) / 4) * 4);
  const coords = points.map((point, index) => ({ x: 40 + index * 780 / Math.max(1, points.length - 1), y: 258 - point.value / maximum * 240 }));
  const curve = coords.reduce((path, point, index) => {
    if (index === 0) return `M${point.x},${point.y}`;
    const previous = coords[index - 1], before = coords[Math.max(0, index - 2)], after = coords[Math.min(coords.length - 1, index + 1)];
    return `${path} C${previous.x + (point.x - before.x) / 6},${previous.y + (point.y - before.y) / 6} ${point.x - (after.x - previous.x) / 6},${point.y - (after.y - previous.y) / 6} ${point.x},${point.y}`;
  }, "");
  return <svg role="img" aria-labelledby={titleId} className="block h-full w-full overflow-visible font-sans">
    <title id={titleId}>{`Jobs Found Over Time. ${points.map((point) => `${point.label}: ${point.value}`).join(", ")}.`}</title>
    <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.2" /><stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" /></linearGradient></defs>
    {[0, 1, 2, 3, 4].map((value) => <g key={value}>
      <line x1="5%" x2="98%" y1={238 - value * 57.5} y2={238 - value * 57.5} className="stroke-border" strokeDasharray="3 3" />
      <text x="4%" y={242 - value * 57.5} textAnchor="end" className="fill-text-muted text-xs font-normal">{maximum * value / 4}</text>
    </g>)}
    {coords.length > 0 && <svg x="5%" y="8" width="93%" height="230" viewBox="40 18 780 240" preserveAspectRatio="none" aria-hidden="true"><path d={`${curve} L${coords[coords.length - 1].x},258 L40,258 Z`} fill={`url(#${gradientId})`} /><path d={curve} fill="none" className="stroke-accent" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg>}
    {coords.map((point, index) => (index % 7 === 0 || index === coords.length - 1) && <text key={points[index].label} x={`${5 + index * 93 / Math.max(1, points.length - 1)}%`} y="265" textAnchor="middle" className="fill-text-muted text-xs font-normal">{points[index].label.slice(5)}</text>)}
  </svg>;
}
