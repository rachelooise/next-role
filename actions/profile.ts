"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { getCompletion, parseProfile, validateResume, type SaveResult } from "@/lib/profile";

export async function saveProfile(formData: FormData): Promise<SaveResult> {
  return persistProfile(formData, false);
}

export async function saveResume(formData: FormData): Promise<SaveResult> {
  return persistProfile(formData, true);
}

async function persistProfile(formData: FormData, resumeOnly: boolean): Promise<SaveResult> {
  let input;
  let resume: File | null = null;
  try {
    const raw = formData.get("profile");
    if (!resumeOnly && (typeof raw !== "string" || raw.length > 100000)) return { success: false, error: "Please check your profile details." };
    input = parseProfile(resumeOnly ? { skills: [], industries: [], work_experience: [], job_titles_seeking: [], preferred_locations: [] } : JSON.parse(String(raw)));
    const file = formData.get("resume");
    if (file instanceof File) { await validateResume(file); resume = file; }
    if (resumeOnly && !resume) return { success: false, error: "Select a PDF before saving your resume." };
  } catch (error) {
    return { success: false, error: error instanceof SyntaxError ? "Please check your profile details." : error instanceof Error ? error.message : "Please check your profile details." };
  }
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "Your session has expired. Sign in again before saving." };
    const client = await createInsforgeServer();
    const existing = await client.database.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (existing.error) return { success: false, error: "Could not check your saved profile. Please try again." };
    if ((existing.data?.updated_at ?? null) !== (formData.get("updatedAt") || null)) return { success: false, error: "Your profile changed in another tab. Reload before saving; copy any edits you want to keep first." };
    const completion = resumeOnly && existing.data
      ? { is_complete: existing.data.is_complete, completion_percentage: existing.data.completion_percentage, missing_fields: existing.data.missing_fields }
      : getCompletion(input, user.email);
    const key = `${user.id}/resume.pdf`;
    const bucket = client.storage.from("resumes");
    let backup: Blob | null = null;
    let resumeUrl: string | null = existing.data?.resume_pdf_url ?? null;
    if (resume) {
      if (existing.data?.resume_pdf_key) {
        const previous = await bucket.download(key);
        if (previous.error || !previous.data) return { success: false, error: "Could not safely replace your current resume. Please try again." };
        backup = previous.data;
      }
      const upload = await bucket.upload(key, resume);
      if (upload.error || !upload.data) return { success: false, error: "Resume upload failed. Your profile edits have not been saved. Please retry." };
      resumeUrl = upload.data.url;
    }
    const resumeFields = resume ? { resume_pdf_key: key, resume_pdf_url: resumeUrl } : {};
    const values = resumeOnly && existing.data ? resumeFields : { ...input, email: user.email, ...completion, ...resumeFields };
    const saved = existing.data
      ? await client.database.from("profiles").update(values).eq("id", user.id).eq("updated_at", existing.data.updated_at).select("updated_at").maybeSingle()
      : await client.database.from("profiles").insert([{ ...values, id: user.id }]).select("updated_at").single();
    if (saved.error || !saved.data) {
      let restored = true;
      if (resume) {
        const recovery = backup ? await bucket.upload(key, backup) : await bucket.remove(key);
        restored = !recovery.error;
      }
      return { success: false, error: restored ? "Your profile could not be saved. Your edits are still here; retry or reload if another tab changed your profile." : "Your profile could not be saved, and the resume replacement could not be undone. Keep this file selected and retry saving to repair the resume reference." };
    }
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return { success: true, completion, updatedAt: saved.data.updated_at, hasResume: Boolean(resume || existing.data?.resume_pdf_key), becameComplete: completion.is_complete && !existing.data?.is_complete };
  } catch {
    console.error("[actions/profile] Profile save interrupted");
    return { success: false, error: "Saving was interrupted. Keep your edits and retry. If you uploaded a resume, it may already have been replaced." };
  }
}
