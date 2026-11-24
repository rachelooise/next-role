import { useId, type ReactElement } from "react";
import type { ChartPoint } from "@/lib/dashboard-preview";

type Props = { title: string; points: ChartPoint[]; maximum: number; tone: "info" | "success" };

export function BarChart({ title, points, maximum, tone }: Props): ReactElement {
  const id = useId();
  const bottom = 238, top = 8;
  const step = 91 / Math.max(1, points.length);
  return <svg role="img" aria-labelledby={id} className="block h-full w-full overflow-visible font-sans">
    <title id={id}>{`${title}. ${points.map((point) => `${point.label}: ${point.value}`).join(", ")}.`}</title>
    {[0, 1, 2, 3, 4].map((index) => {
      const y = bottom - index * (bottom - top) / 4;
      return <g key={index}>
        <line x1="7%" x2="98%" y1={y} y2={y} className="stroke-border" strokeDasharray="3 3" />
        <text x="5.5%" y={y + 4} textAnchor="end" className="fill-text-muted text-xs font-normal">{maximum * index / 4}</text>
      </g>;
    })}
    {points.map((point, index) => {
      const height = (bottom - top) * Math.max(0, Math.min(point.value, maximum)) / maximum;
      const x = 7 + step * (index + 0.5);
      return <g key={point.label}>
        <svg x={`${x - step / 4}%`} y={bottom - height} width={`${step / 2}%`} height={height} viewBox="0 0 40 240" preserveAspectRatio="none" aria-hidden="true"><path d="M0,240 V4 Q0,0 4,0 H36 Q40,0 40,4 V240 Z" className={tone === "info" ? "fill-info" : "fill-success"} /></svg>
        <text x={`${x}%`} y={265} textAnchor="middle" className="fill-text-muted text-xs font-normal">{point.label}</text>
      </g>;
    })}
  </svg>;
}
