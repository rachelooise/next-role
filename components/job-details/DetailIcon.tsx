import type { ReactElement } from "react";

type Props = { name: "company" | "salary" | "location" | "briefcase" | "calendar" | "sparkles" | "file" | "search" | "external" | "back" | "people" | "shield" | "checklist" | "question" | "message" | "compass" | "code"; className?: string };
const paths = {
  company: "M8 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M8 9H5a2 2 0 0 0-2 2v10h18V9a2 2 0 0 0-2-2h-1M11 7h4M11 11h4M11 15h4M11 21v-3h4v3",
  salary: "M12 2v20M17 5H9a4 4 0 0 0 0 8h6a4 4 0 0 1 0 8H6",
  location: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  briefcase: "M8 21V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v16M3 7h18v14H3Z",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z",
  sparkles: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4M18 4h4",
  file: "M14 2H5v20h14V7ZM14 2v6h5M8 12h8M8 16h8",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  external: "M14 3h7v7M21 3 11 13M10 5H4v16h16v-7",
  back: "m15 18-6-6 6-6",
  people: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  shield: "M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6ZM8 12l3 3 5-5",
  checklist: "m3 6 1 1 2-2M10 6h11M3 12l1 1 2-2M10 12h11M3 18l1 1 2-2M10 18h11",
  question: "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  message: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2ZM7 7h10M7 11h7",
  compass: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM16 8l-3 5-5 3 3-5Z",
  code: "m7 7-5 5 5 5M17 7l5 5-5 5M14 4l-4 16",
};
export function DetailIcon({ name, className = "size-5" }: Props): ReactElement {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 ${className}`}><path d={paths[name]} /></svg>;
}
