import "server-only";
import type { InsForgeClient } from "@insforge/sdk";

type PersistResult = { success: true; updatedAt: string; size: number } | { success: false; error: string };

export async function persistGeneratedResume(client: InsForgeClient, owner: string, updatedAt: string, buffer: Buffer): Promise<PersistResult> {
  const current = await client.database.from("profiles").select("updated_at,resume_pdf_key").eq("id", owner).maybeSingle();
  if (current.error || !current.data || current.data.updated_at !== updatedAt) return { success: false, error: "Your saved profile changed during generation. Reload before trying again; copy any edits you want to keep first." };
  const key = `${owner}/resume.pdf`;
  const bucket = client.storage.from("resumes");
  let backup: Blob | null = null;
  if (current.data.resume_pdf_key) {
    if (current.data.resume_pdf_key !== key) return { success: false, error: "Could not safely replace your saved resume." };
    const previous = await bucket.download(key);
    if (previous.error || !previous.data) return { success: false, error: "Could not safely back up your current resume. Please retry." };
    backup = previous.data;
  }
  // The canonical key follows Feature 06. Storage and database writes cannot be atomic.
  let uploaded = false;
  try {
    const upload = await bucket.upload(key, new Blob([new Uint8Array(buffer)], { type: "application/pdf" }));
    if (upload.error || !upload.data) return { success: false, error: "Could not upload the generated resume. Please retry." };
    uploaded = true;
    const saved = await client.database.from("profiles").update({ resume_pdf_key: key, resume_pdf_url: upload.data.url }).eq("id", owner).eq("updated_at", updatedAt).select("updated_at").maybeSingle();
    if (!saved.error && saved.data) return { success: true, updatedAt: saved.data.updated_at, size: buffer.length };
  } catch { console.error("[resume/generate] Resume persistence interrupted"); }
  if (uploaded) {
    try {
      const recovery = backup ? await bucket.upload(key, backup) : await bucket.remove(key);
      if (!recovery.error) return { success: false, error: "Could not save the generated resume. The previous resume was restored. Please reload before retrying." };
    } catch { console.error("[resume/generate] Resume recovery interrupted"); }
    return { success: false, error: "Resume saving was interrupted and recovery could not be confirmed. View your resume and retry generation to repair it." };
  }
  return { success: false, error: "Resume uploading was interrupted. Check View Resume before retrying; the upload may have completed." };
}
