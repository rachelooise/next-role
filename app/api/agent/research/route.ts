import { getAuthUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { researchRequestSchema } from "@/lib/company-research";
import { queueResearch, readResearch } from "@/lib/research-server";

function reply(value: unknown, status: number): Response {
  return Response.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await getAuthUser();
    if (!user) return reply({ success: false, error: "Please sign in to view company research." }, 401);
    const parsed = researchRequestSchema.safeParse({ jobId: new URL(request.url).searchParams.get("jobId") });
    if (!parsed.success) return reply({ success: false, error: "Invalid research request." }, 400);
    const state = await readResearch(await createInsforgeServer(), user.id, parsed.data.jobId);
    return state ? reply({ success: true, state }, 200) : reply({ success: false, error: "Job not found." }, 404);
  } catch {
    console.error("[research/api] Could not load status");
    return reply({ success: false, error: "Could not check research. Please try again." }, 503);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin) return reply({ success: false, error: "Please start research from the job details page." }, 403);
    const user = await getAuthUser();
    if (!user) return reply({ success: false, error: "Please sign in before researching a company." }, 401);
    if (Number(request.headers.get("content-length")) > 256) return reply({ success: false, error: "Invalid research request." }, 400);
    const body = await request.text();
    if (body.length > 256) return reply({ success: false, error: "Invalid research request." }, 400);
    let input: unknown;
    try { input = JSON.parse(body); } catch { return reply({ success: false, error: "Invalid research request." }, 400); }
    const parsed = researchRequestSchema.safeParse(input);
    if (!parsed.success) return reply({ success: false, error: "Invalid research request." }, 400);
    const client = await createInsforgeServer();
    const existing = await readResearch(client, user.id, parsed.data.jobId);
    if (!existing) return reply({ success: false, error: "Job not found." }, 404);
    if (!process.env.TRIGGER_SECRET_KEY || !process.env.TRIGGER_PROJECT_REF) return reply({ success: false, error: "Company research is not configured yet. Please try again later." }, 503);
    const profile = await client.database.from("profiles").select("id,skills").eq("id", user.id).maybeSingle();
    if (profile.error) return reply({ success: false, error: "Could not load your saved profile. Please retry." }, 503);
    if (!profile.data || !Array.isArray(profile.data.skills) || !profile.data.skills.length) return reply({ success: false, error: "Save at least one skill in Profile before researching a company." }, 422);
    const state = await queueResearch(client, user.id, parsed.data.jobId);
    return state ? reply({ success: true, state }, 202) : reply({ success: false, error: "Job not found." }, 404);
  } catch {
    console.error("[research/api] Could not start research");
    return reply({ success: false, error: "Could not confirm research started. Check its status before trying again." }, 503);
  }
}
