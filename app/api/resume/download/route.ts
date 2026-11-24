import { getAuthUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { connection } from "next/server";

export async function GET(): Promise<Response> {
  await connection();
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ success: false, error: "Please sign in to open your resume." }, { status: 401 });
    const client = await createInsforgeServer();
    const profile = await client.database.from("profiles").select("resume_pdf_key").eq("id", user.id).maybeSingle();
    if (profile.error) return Response.json({ success: false, error: "Could not load your resume." }, { status: 503 });
    if (profile.data?.resume_pdf_key !== `${user.id}/resume.pdf`) return Response.json({ success: false, error: "No saved resume found." }, { status: 404 });
    const file = await client.storage.from("resumes").download(profile.data.resume_pdf_key);
    if (file.error || !file.data) return Response.json({ success: false, error: "Could not open your resume. Please try again." }, { status: 503 });
    return new Response(file.data, { headers: { "Content-Type": "application/pdf", "Content-Disposition": 'inline; filename="resume.pdf"', "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    console.error("[resume/download] Resume download failed");
    return Response.json({ success: false, error: "Could not open your resume." }, { status: 500 });
  }
}
