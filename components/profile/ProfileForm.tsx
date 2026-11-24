"use client";

import { useRef, useState, useTransition, type FormEvent, type ReactElement } from "react";
import { saveProfile, saveResume } from "@/actions/profile";
import { ProfileField } from "@/components/profile/ProfileField";
import { ResumeUpload } from "@/components/profile/ResumeUpload";
import { TagInput } from "@/components/profile/TagInput";
import { WorkRole } from "@/components/profile/WorkRole";
import { ProfileAttention } from "@/components/profile/ProfileAttention";
import { getCompletion, type ProfileInput } from "@/lib/profile";
import { emptyProfile, mergeExtraction, readProfileFields } from "@/lib/profile-extraction";
import { requestResumeExtraction, requestResumeGeneration } from "@/lib/resume-client";
import type { Profile } from "@/types/database";

type Props = { email: string; profile: Profile | null };
function options(pairs: [string, string][]): { value: string; label: string }[] {
  return pairs.map(([value, label]) => ({ value, label }));
}

export function ProfileForm({ email, profile }: Props): ReactElement {
  const [roles, setRoles] = useState(() => (profile?.work_experience ?? []).map((_, index) => index));
  const [nextRole, setNextRole] = useState(profile?.work_experience.length ?? 0);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [resumeMessage, setResumeMessage] = useState("");
  const [resumeFailed, setResumeFailed] = useState(false);
  const [saving, startTransition] = useTransition();
  const [extracting, setExtracting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState("");
  const [generationFailed, setGenerationFailed] = useState(false);
  const pending = saving || extracting || generating;
  const form = useRef<HTMLFormElement>(null);
  const [draft, setDraft] = useState<ProfileInput>(() => profile ?? emptyProfile());
  const [revision, setRevision] = useState(0);
  const [undo, setUndo] = useState<ProfileInput | null>(null);
  const [extractionMessage, setExtractionMessage] = useState("");
  const [extractionFailed, setExtractionFailed] = useState(false);
  const [resume, setResume] = useState<File | null>(null);
  const [savedResumeFile, setSavedResumeFile] = useState<{ name: string; size: number } | null>(null);
  const [hasResume, setHasResume] = useState(Boolean(profile?.resume_pdf_key));
  const [updatedAt, setUpdatedAt] = useState(profile?.updated_at ?? "");
  const [completion, setCompletion] = useState(() => getCompletion(profile ?? emptyProfile(), email));
  async function generate(): Promise<void> {
    if (pending || resume || !updatedAt) return;
    setGenerating(true);
    setGenerationFailed(false);
    setGenerationMessage("");
    try {
      const generated = await requestResumeGeneration(updatedAt);
      setUpdatedAt(generated.updatedAt);
      setSavedResumeFile({ name: generated.name, size: generated.size });
      setHasResume(true);
      setResumeMessage("");
      setGenerationMessage("Resume generated and saved. Use View Resume to review it before applying.");
    } catch (error) {
      setGenerationFailed(true);
      setGenerationMessage(error instanceof Error ? error.message : "Could not generate your resume. Please retry.");
    } finally { setGenerating(false); }
  }
  function applyDraft(value: ProfileInput): void {
    setDraft(value);
    setRoles(value.work_experience.map((_, index) => index));
    setNextRole(value.work_experience.length);
    setRevision((value) => value + 1);
  }
  async function extract(): Promise<void> {
    if (pending || resume || !hasResume || !form.current) return;
    let before: ProfileInput;
    try { before = readProfileFields(new FormData(form.current), roles); }
    catch (error) { setExtractionFailed(true); setExtractionMessage(error instanceof Error ? error.message : "Check your form entries before extracting."); return; }
    setExtracting(true);
    setExtractionFailed(false);
    setExtractionMessage("");
    try {
      const extracted = await requestResumeExtraction(updatedAt);
      const merged = mergeExtraction(before, extracted);
      setUndo(before);
      applyDraft(merged);
      setMessage("");
      setExtractionMessage("Profile fields filled in. Review and save below.");
    } catch (error) {
      setExtractionFailed(true);
      setExtractionMessage(error instanceof Error && error.name !== "TimeoutError" ? error.message : "Extraction timed out. Your form is unchanged. Please retry.");
    } finally { setExtracting(false); }
  }
  function submitResume(): void {
    if (!resume || pending) return;
    const request = new FormData();
    request.set("resume", resume);
    request.set("updatedAt", updatedAt);
    setResumeMessage("");
    setResumeFailed(false);
    startTransition(async () => {
      try {
        const result = await saveResume(request);
        if (!result.success) { setResumeFailed(true); setResumeMessage(result.error ?? "Could not save your resume. Please retry."); return; }
        setUpdatedAt(result.updatedAt ?? "");
        setHasResume(Boolean(result.hasResume));
        setSavedResumeFile({ name: resume.name, size: resume.size });
        setResume(null);
        if (result.completion) setCompletion(result.completion);
        setResumeMessage("Resume saved.");
      } catch { setResumeFailed(true); setResumeMessage("Resume saving was interrupted. Keep your selection and retry."); }
    });
  }
  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (pending) return;
    let payload: ProfileInput;
    try { payload = readProfileFields(new FormData(event.currentTarget), roles); }
    catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : "Please check your profile details."); return; }
    const request = new FormData();
    request.set("profile", JSON.stringify(payload));
    request.set("updatedAt", updatedAt);
    if (resume) request.set("resume", resume);
    setMessage("");
    setFailed(false);
    startTransition(async () => {
      try {
        const result = await saveProfile(request);
        if (!result.success) { setFailed(true); setMessage(result.error ?? "Could not save your profile. Please retry."); return; }
        setUpdatedAt(result.updatedAt ?? "");
        setHasResume(Boolean(result.hasResume));
        if (resume) setSavedResumeFile({ name: resume.name, size: resume.size });
        setResume(null);
        if (result.completion) setCompletion(result.completion);
        setUndo(null);
        setExtractionMessage("");
        setMessage("Profile saved." + (resume ? " Your resume was uploaded." : ""));
      } catch { setFailed(true); setMessage("Saving was interrupted. Your edits are still here. Please retry."); }
    });
  }
  return <div className="app-page space-y-6">
    <h1 className="app-heading">Your profile</h1>
    <p className="app-muted">Your profile helps us find relevant roles. Save your changes when you are ready.</p>
    <ProfileAttention completion={completion} />
    <ResumeUpload file={resume} onFile={(file) => { setResume(file); setResumeMessage(""); setGenerationMessage(""); }} hasSavedResume={hasResume} savedFile={savedResumeFile} pending={pending} onSave={submitResume} saveMessage={resumeMessage} saveFailed={resumeFailed} onExtract={() => { void extract(); }} extracting={extracting} extractionMessage={extractionMessage} extractionFailed={extractionFailed} canUndo={Boolean(undo)} onUndo={() => { if (undo) { applyDraft(undo); setUndo(null); setExtractionMessage("Extraction undone. Your previous form entries are restored."); } }} onGenerate={() => { void generate(); }} generating={generating} canGenerate={Boolean(updatedAt)} generationMessage={generationMessage} generationFailed={generationFailed} />
    <form ref={form} key={revision} className="app-card" onSubmit={submit} aria-busy={pending}>
      <h2 className="app-heading">Profile Information</h2>
      <p className="mt-1 app-muted">Help us understand your experience and what you want next. Incomplete profiles can be saved.</p>
      <fieldset disabled={pending} className="min-w-0">
        <fieldset className="profile-section"><legend>Personal Info</legend><div className="grid gap-5 sm:grid-cols-2">
          <ProfileField name="full_name" label="Full name" value={draft?.full_name ?? ""} />
          <ProfileField label="Email" value={email} type="email" readOnly />
          <ProfileField name="phone" label="Phone number (optional)" type="tel" value={draft?.phone ?? ""} placeholder="+1 (555) 000-0000" />
          <ProfileField name="location" label="Location" value={draft?.location ?? ""} placeholder="City, Country" />
          <ProfileField name="linkedin_url" label="LinkedIn URL (optional)" type="url" value={draft?.linkedin_url ?? ""} />
          <ProfileField name="portfolio_url" label="Portfolio / GitHub (optional)" type="url" value={draft?.portfolio_url ?? ""} />
          <ProfileField name="work_authorization" label="Work authorization" value={draft?.work_authorization ?? ""} options={options([["citizen", "Citizen"], ["permanent_resident", "Permanent resident"], ["visa_required", "Requires a work visa / sponsorship"]])} />
        </div></fieldset>
        <fieldset className="profile-section"><legend>Professional Info</legend><div className="space-y-5">
          <ProfileField name="current_title" label="Current/recent job title" value={draft?.current_title ?? ""} />
          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileField name="experience_level" label="Experience level" value={draft?.experience_level ?? ""} options={options([["junior", "Junior"], ["mid", "Mid-level"], ["senior", "Senior"], ["lead", "Lead"]])} />
            <ProfileField name="years_experience" label="Years of experience" type="number" value={draft?.years_experience?.toString() ?? ""} />
          </div>
          <TagInput name="skills" label="Skills" initial={draft?.skills ?? []} placeholder="Add a skill" />
          <TagInput name="industries" label="Industries worked in (optional)" initial={draft?.industries ?? []} placeholder="E.g. FinTech, Healthcare" />
        </div></fieldset>
        <fieldset className="profile-section"><legend>Work Experience (optional)</legend><div className="space-y-4">
          {roles.map((id) => <WorkRole key={id} id={id} initial={draft?.work_experience[id]} onRemove={() => setRoles(roles.filter((role) => role !== id))} />)}
          <button type="button" disabled={roles.length >= 3} className="text-sm font-medium text-accent disabled:opacity-40" onClick={() => { setRoles([...roles, nextRole]); setNextRole(nextRole + 1); }}>+ Add role {roles.length >= 3 && "(maximum 3)"}</button>
        </div></fieldset>
        <fieldset className="profile-section"><legend>Education (optional)</legend><div className="grid gap-5 sm:grid-cols-2">
          <ProfileField name="degree" label="Highest degree" value={draft?.education?.degree ?? ""} options={options(["High School", "Associate", "Bachelor's", "Master's", "Doctorate", "Other"].map((degree): [string, string] => [degree, degree]))} />
          <ProfileField name="field_of_study" label="Field of study" value={draft?.education?.field_of_study ?? ""} />
          <ProfileField name="institution" label="Institution name" value={draft?.education?.institution ?? ""} placeholder="E.g. State University" />
          <ProfileField name="graduation_year" label="Graduation year" type="number" value={draft?.education?.graduation_year?.toString() ?? ""} placeholder="YYYY" />
        </div></fieldset>
        <fieldset className="profile-section"><legend>Job Preferences</legend><div className="space-y-5">
          <ProfileField name="job_titles_seeking" label="Job titles seeking" value={draft?.job_titles_seeking.join(", ") ?? ""} placeholder="Separate titles with commas" />
          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileField name="remote_preference" label="Remote preference" value={draft?.remote_preference ?? ""} options={options([["any", "Any"], ["remote", "Remote"], ["hybrid", "Hybrid"], ["onsite", "On-site"]])} />
            <ProfileField name="salary_expectation" label="Salary expectation (optional)" value={draft?.salary_expectation ?? ""} placeholder="E.g. $120k+" />
          </div>
          <ProfileField name="preferred_locations" label="Preferred locations (optional)" value={draft?.preferred_locations.join(", ") ?? ""} placeholder="E.g. New York, London" />
        </div></fieldset>
        <button className="app-primary w-full" type="submit" disabled={pending}>{saving ? "Saving profile…" : "Save Profile"}</button>
      </fieldset>
      <p role={failed ? "alert" : "status"} className={`mt-4 text-sm ${failed ? "text-error" : "text-text-secondary"}`}>{message}</p>
    </form>
  </div>;
}

