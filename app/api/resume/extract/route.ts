import { getAuthUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { extractResume } from "@/agent/resume-extractor";

export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ success: false, error: "Please extract from your profile page." }, { status: 403 });
    const user = await getAuthUser();
    if (!user) return Response.json({ success: false, error: "Please sign in before extracting your resume." }, { status: 401 });
    if (Number(request.headers.get("content-length")) > 2048) return Response.json({ success: false, error: "Invalid extraction request." }, { status: 400 });
    let body: unknown;
    try { body = await request.json(); }
    catch { return Response.json({ success: false, error: "Invalid extraction request." }, { status: 400 }); }
    if (!body || typeof body !== "object" || !("updatedAt" in body) || typeof body.updatedAt !== "string" || body.updatedAt.length > 100) return Response.json({ success: false, error: "Invalid extraction request." }, { status: 400 });
    const client = await createInsforgeServer();
    const profile = await client.database.from("profiles").select("resume_pdf_key,updated_at").eq("id", user.id).maybeSingle();
    if (profile.error) return Response.json({ success: false, error: "Could not load your saved resume. Please retry." }, { status: 503 });
    if (profile.data?.resume_pdf_key !== `${user.id}/resume.pdf`) return Response.json({ success: false, error: "Save a resume PDF before extracting details." }, { status: 404 });
    if (profile.data.updated_at !== body.updatedAt) return Response.json({ success: false, error: "Your saved profile changed. Reload before extracting; copy any edits you want to keep first." }, { status: 409 });
    const file = await client.storage.from("resumes").download(profile.data.resume_pdf_key);
    if (file.error || !file.data) return Response.json({ success: false, error: "Could not read your saved resume. Please retry." }, { status: 503 });
    const result = await extractResume(file.data);
    if (!result.success) {
      const logged = await client.database.from("agent_logs").insert([{ user_id: user.id, level: "error", message: "Resume profile extraction failed." }]);
      if (logged.error) console.error("[resume/extract] Could not record extraction failure");
    }
    return Response.json(result, { status: result.success ? 200 : 422, headers: { "Cache-Control": "private, no-store" } });
  } catch {
    console.error("[resume/extract] Request failed");
    return Response.json({ success: false, error: "Could not extract your resume. Please try again." }, { status: 500 });
  }
}
