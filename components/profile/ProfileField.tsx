import type { ReactElement } from "react";

type Props = { label: string; name?: string; value?: string; placeholder?: string; type?: string; options?: { value: string; label: string }[]; readOnly?: boolean };

export function ProfileField({ label, name, value, placeholder, type = "text", options, readOnly }: Props): ReactElement {
  return <label className="grid gap-2 app-muted"><span className="uppercase">{label}</span>{options ? <select name={name} className="app-input" defaultValue={value ?? ""}><option value="">Select an option</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input name={name} className="app-input read-only:bg-surface-muted" type={type} defaultValue={value} placeholder={placeholder} readOnly={readOnly} />}</label>;
}
