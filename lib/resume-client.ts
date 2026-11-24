import type { ProfileInput } from "@/lib/profile";
import { validateExtraction } from "@/lib/profile-extraction";

export async function requestResumeGeneration(updatedAt: string): Promise<{ updatedAt: string; name: string; size: number }> {
  let response: Response;
  let result: unknown;
  try {
    response = await fetch("/api/resume/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updatedAt }), signal: AbortSignal.timeout(65000) });
    result = await response.json();
  } catch { throw new Error("Generation was interrupted. Check View Resume before retrying; your form edits are still here."); }
  if (!result || typeof result !== "object" || !("success" in result)) throw new Error("Could not generate your resume. Please retry.");
  if (!response.ok || result.success !== true || !("data" in result)) throw new Error("error" in result && typeof result.error === "string" ? result.error : "Could not generate your resume. Please retry.");
  const data = result.data;
  if (!data || typeof data !== "object" || !("updatedAt" in data) || typeof data.updatedAt !== "string" || !("name" in data) || typeof data.name !== "string" || !("size" in data) || typeof data.size !== "number" || !Number.isFinite(data.size) || data.size <= 0) throw new Error("The response could not be read. Reload to check your saved resume; copy unsaved edits first.");
  return { updatedAt: data.updatedAt, name: data.name, size: data.size };
}

export async function requestResumeExtraction(updatedAt: string): Promise<ProfileInput> {
  let response: Response;
  let result: unknown;
  try {
    response = await fetch("/api/resume/extract", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updatedAt }), signal: AbortSignal.timeout(65000),
    });
    result = await response.json();
  } catch { throw new Error("Could not reach resume extraction. Your form is unchanged. Please try again."); }
  if (!result || typeof result !== "object" || !("success" in result)) throw new Error("Could not extract your resume. Please try again.");
  if (!response.ok || result.success !== true || !("data" in result)) {
    throw new Error("error" in result && typeof result.error === "string" ? result.error : "Could not extract your resume. Please try again.");
  }
  return validateExtraction(result.data);
}
