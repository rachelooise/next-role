"use client";

import { useState, type ReactElement } from "react";

type Props = { label: string; name: string; initial: string[]; placeholder: string };

export function TagInput({ label, name, initial, placeholder }: Props): ReactElement {
  const [tags, setTags] = useState(initial);
  const [draft, setDraft] = useState("");
  function addTag(): void {
    const value = draft.trim();
    if (value && !tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) setTags([...tags, value]);
    setDraft("");
  }
  return <div className="space-y-3"><input type="hidden" name={name} value={JSON.stringify(tags)} /><label className="grid gap-2 app-muted"><span className="uppercase">{label}</span><span className="flex gap-2"><input className="app-input min-w-0 flex-1" value={draft} maxLength={100} placeholder={placeholder} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} /><button type="button" className="app-secondary" onClick={addTag}>Add</button></span></label><div className="flex flex-wrap gap-2">{tags.map((tag) => <button type="button" key={tag} className="rounded-full border bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-primary hover:text-accent" aria-label={`Remove ${tag}`} onClick={() => setTags(tags.filter((item) => item !== tag))}>{tag} ×</button>)}</div></div>;
}
