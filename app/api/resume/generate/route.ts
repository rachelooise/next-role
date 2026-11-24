import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { parseProfile } from "@/lib/profile";
import { generateResumeContent } from "@/agent/resume-generator";
import { renderResumePdf } from "@/lib/resume-pdf";
import { persistGeneratedResume } from "@/lib/generated-resume";

export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  const reply = (value: unknown, status: number): Response => Response.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin) return reply({ success: false, error: "Please generate from your profile page." }, 403);
    const user = await getAuthUser();
    if (!user) return reply({ success: false, error: "Please sign in before generating a resume." }, 401);
    if (Number(request.headers.get("content-length")) > 2048) return reply({ success: false, error: "Invalid generation request." }, 400);
    const raw = await request.text();
    if (raw.length > 2048) return reply({ success: false, error: "Invalid generation request." }, 400);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return reply({ success: false, error: "Invalid generation request." }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body) || !("updatedAt" in body) || typeof body.updatedAt !== "string" || !body.updatedAt || body.updatedAt.length > 100) return reply({ success: false, error: "Save your profile before generating a resume." }, 400);
    const client = await createInsforgeServer();
    const saved = await client.database.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (saved.error) return reply({ success: false, error: "Could not load your saved profile. Please retry." }, 503);
    if (!saved.data) return reply({ success: false, error: "Save your profile before generating a resume." }, 404);
    if (saved.data.updated_at !== body.updatedAt) return reply({ success: false, error: "Your saved profile changed. Reload before generating; copy any edits you want to keep first." }, 409);
    const profile = parseProfile(saved.data);
    if (!profile.full_name || !(profile.current_title || profile.skills.length || profile.work_experience.length)) return reply({ success: false, error: "Save your full name and a job title, skills or work experience before generating." }, 422);
    const result = await generateResumeContent(profile);
    if (!result.success) {
      const logged = await client.database.from("agent_logs").insert([{ user_id: user.id, level: "error", message: "Resume generation failed." }]);
      if (logged.error) console.error("[resume/generate] Could not record failure");
      return reply(result, 422);
    }
    let buffer: Buffer;
    try { buffer = await renderResumePdf(profile, user.email, result.data); }
    catch { return reply({ success: false, error: "Could not fit your saved details on one readable page. Shorten long skills, links or role descriptions and retry. Your current resume is unchanged." }, 422); }
    const persisted = await persistGeneratedResume(client, user.id, body.updatedAt, buffer);
    if (!persisted.success) return reply(persisted, 409);
    revalidatePath("/profile");
    return reply({ success: true, data: { updatedAt: persisted.updatedAt, name: "Generated Resume.pdf", size: persisted.size } }, 200);
  } catch {
    console.error("[resume/generate] Request failed");
    return reply({ success: false, error: "Generation was interrupted. Check View Resume before retrying." }, 500);
  }
}
