"use client";

import { useRef, useState, type ReactElement } from "react";
import { validateResume } from "@/lib/profile";

type Props = {
  file: File | null;
  onFile: (file: File | null) => void;
  hasSavedResume: boolean;
  savedFile: { name: string; size: number } | null;
  pending: boolean;
  onSave: () => void;
  saveMessage: string;
  saveFailed: boolean;
  onExtract: () => void;
  extracting: boolean;
  extractionMessage: string;
  extractionFailed: boolean;
  canUndo: boolean;
  onUndo: () => void;
  onGenerate: () => void;
  generating: boolean;
  canGenerate: boolean;
  generationMessage: string;
  generationFailed: boolean;
};

export function ResumeUpload({ file, onFile, hasSavedResume, savedFile, pending, onSave, saveMessage, saveFailed, onExtract, extracting, extractionMessage, extractionFailed, canUndo, onUndo, onGenerate, generating, canGenerate, generationMessage, generationFailed }: Props): ReactElement {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const outlinedButton = "app-secondary border-accent/60 text-accent-dark hover:bg-accent-muted";
  const visibleMessage = file ? message : message.startsWith("Selected.") ? "" : message;

  async function selectFile(candidate: File | undefined): Promise<void> {
    if (!candidate || pending) return;
    try { await validateResume(candidate); onFile(candidate); setMessage(""); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not read this PDF. Please try again."); }
  }

  return <section className="app-card space-y-6" aria-labelledby="resume-heading">
    <div>
      <h2 id="resume-heading" className="app-heading">Resume</h2>
      <p className="app-muted mt-1">Manage your resume and keep your profile up to date.</p>
    </div>
    <input ref={input} type="file" accept="application/pdf,.pdf" aria-label="Select resume PDF" className="sr-only" disabled={pending} onChange={(event) => { void selectFile(event.target.files?.[0]); event.target.value = ""; }} />
    {hasSavedResume && <div className="flex flex-col gap-4 rounded-xl bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent-light/50 text-accent" aria-hidden="true">
          <svg className="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg>
        </span>
        <div className="min-w-0">
          <p className="break-words text-sm font-medium leading-5 text-text-primary">{savedFile?.name ?? "Resume.pdf"}</p>
          <p className="app-muted mt-1">PDF{savedFile ? ` · ${Math.max(1, Math.round(savedFile.size / 1024))} KB` : " document"}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-3 sm:justify-end">
        <a className={outlinedButton} href="/api/resume/download" target="_blank" rel="noopener noreferrer">View Resume</a>
        <button type="button" className={outlinedButton} disabled={pending} onClick={() => input.current?.click()}>Replace</button>
      </div>
    </div>}
    {(!hasSavedResume || file) && <div className="rounded-xl border border-dashed border-border bg-surface-secondary p-5 text-center" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void selectFile(event.dataTransfer.files[0]); }}>
      {file ? <>
        <p className="break-all text-sm font-medium leading-5 text-text-primary">{file.name}</p>
        <p className="app-muted mt-1">{hasSavedResume ? "Selected replacement" : "Selected PDF"} · {Math.max(1, Math.round(file.size / 1024))} KB</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button type="button" className="app-secondary" disabled={pending} onClick={() => { onFile(null); setMessage(""); }}>Cancel</button>
          <button type="button" className="app-primary" disabled={pending} onClick={onSave}>{pending ? "Saving…" : "Save Resume"}</button>
        </div>
      </> : <>
        <p className="text-sm font-medium text-text-primary">Upload your resume to get started</p>
        <p className="app-muted mt-1">Drag and drop a PDF, up to 5 MB.</p>
        <button type="button" className="app-secondary mt-4" disabled={pending} onClick={() => input.current?.click()}>Select Resume</button>
      </>}
    </div>}
    {saveMessage && <p role={saveFailed ? "alert" : "status"} className={saveFailed ? "text-sm text-error" : "text-sm text-success-foreground"}>{saveMessage}</p>}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-sm font-medium leading-5 text-text-primary">Fill your profile from your resume</h3>
        <p id="resume-extract-hint" className="app-muted mt-1">{file ? "Save or cancel your selected PDF before extracting." : "Extract your experience, education and skills into the form below."}</p>
      </div>
      <button type="button" className="app-primary self-start shrink-0" disabled={pending || Boolean(file) || !hasSavedResume} aria-describedby="resume-extract-hint" onClick={onExtract}>{extracting ? "Extracting…" : "Extract to Profile"}</button>
    </div>
    {extractionMessage && (extractionFailed ? <p role="alert" className="text-sm text-error">{extractionMessage}</p> : canUndo ? <div className="flex flex-wrap items-center gap-4 rounded-xl bg-success-lightest p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-foreground text-accent-foreground" aria-hidden="true"><svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg></span>
      <div className="min-w-0 flex-1" role="status">
        <p className="text-sm font-medium leading-5 text-text-primary">Resume details added to your profile</p>
        <p className="mt-1 text-xs font-normal leading-4 text-success-foreground">{extractionMessage}</p>
      </div>
      <button type="button" className="rounded-md px-2 py-1 text-sm font-semibold text-success-foreground hover:text-success-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success disabled:opacity-40" disabled={pending} onClick={onUndo}>Undo</button>
    </div> : <p role="status" className="text-sm text-success-foreground">{extractionMessage}</p>)}
    <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-sm font-medium leading-5 text-text-primary">Need a new resume?</h3>
        <p id="resume-generate-hint" className="app-muted mt-1">{file ? "Save or cancel your selected PDF before generating." : !canGenerate ? "Save your profile details before generating." : "Uses saved details and replaces your current resume. Save form edits first to include them."}</p>
        <p className="app-muted mt-1">Your professional details are sent to Google Gemini to polish the summary and experience.</p>
      </div>
      <button type="button" className={`${outlinedButton} gap-2 shrink-0 self-start`} disabled={pending || Boolean(file) || !canGenerate} aria-describedby="resume-generate-hint" onClick={onGenerate}>
        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" /><path d="M20 2v4m-2-2h4" /></svg>
        {generating ? "Generating…" : "Generate Resume"}
      </button>
    </div>
    {generationMessage && <p role={generationFailed ? "alert" : "status"} className={`text-sm ${generationFailed ? "text-error" : "text-success-foreground"}`}>{generationMessage}</p>}
    {visibleMessage && <p role="status" className="app-muted">{visibleMessage}</p>}
  </section>;
}
