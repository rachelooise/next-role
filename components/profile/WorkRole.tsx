"use client";

import { useState, type ReactElement } from "react";
import { ProfileField } from "@/components/profile/ProfileField";
import type { WorkExperience } from "@/types/database";

type Props = { id: number; initial?: WorkExperience; onRemove: () => void };

export function WorkRole({ id, initial, onRemove }: Props): ReactElement {
  const [current, setCurrent] = useState(initial?.is_current ?? false);
  return <div className="space-y-4 rounded-lg border bg-surface p-6"><input type="hidden" name="roleId" value={id} /><div className="flex justify-between"><h3 className="text-sm font-medium">Role details</h3><button type="button" className="app-muted hover:text-error" onClick={onRemove}>Remove role</button></div><div className="grid gap-4 sm:grid-cols-2"><ProfileField name={`role.${id}.company`} label="Company name" value={initial?.company} /><ProfileField name={`role.${id}.job_title`} label="Job title" value={initial?.job_title} /><ProfileField name={`role.${id}.start_date`} label="Start date" type="month" value={initial?.start_date} /><label className="grid gap-2 app-muted">END DATE<input name={`role.${id}.end_date`} className="app-input" type="month" defaultValue={initial?.end_date ?? ""} disabled={current} /></label></div><label className="flex items-center gap-2 app-muted"><input name={`role.${id}.is_current`} type="checkbox" checked={current} onChange={(event) => setCurrent(event.target.checked)} className="accent-accent" />Currently working here</label><label className="grid gap-2 app-muted">KEY RESPONSIBILITIES<textarea name={`role.${id}.responsibilities`} className="app-input min-h-24 resize-y" defaultValue={initial?.responsibilities} maxLength={10000} /></label></div>;
}
