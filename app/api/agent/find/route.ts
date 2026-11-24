import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { parseProfile } from "@/lib/profile";
import { canDiscover, parseJobSearch, type JobSearch } from "@/lib/job-discovery";
import { adzunaCredentials } from "@/lib/adzuna";
import { discoverJobs } from "@/agent/adzuna";

export const maxDuration = 180;

export async function POST(request: Request): Promise<Response> {
  const reply = (value: unknown, status: number): Response => Response.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin) return reply({ success: false, error: "Please search from the Find Jobs page." }, 403);
    const user = await getAuthUser();
    if (!user) return reply({ success: false, error: "Please sign in before searching for jobs." }, 401);
    if (Number(request.headers.get("content-length")) > 2048) return reply({ success: false, error: "Invalid search request." }, 400);
    const raw = await request.text();
    if (raw.length > 2048) return reply({ success: false, error: "Invalid search request." }, 400);
    let search: JobSearch;
    try { search = parseJobSearch(JSON.parse(raw)); } catch { return reply({ success: false, error: "Enter a job title, a supported country and an optional location (up to 200 characters)." }, 400); }
    const client = await createInsforgeServer();
    const saved = await client.database.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (saved.error) return reply({ success: false, error: "Could not load your saved profile. Please retry." }, 503);
    const profile = saved.data ? parseProfile(saved.data) : null;
    if (!profile || !canDiscover(profile)) return reply({ success: false, error: "Save at least one skill and a current or desired job title in Profile before searching." }, 422);
    if (!adzunaCredentials() || !process.env.GEMINI_API_KEY) return reply({ success: false, error: "Job discovery is not configured. Please try again later." }, 503);
    const result = await discoverJobs(client, user.id, search, profile);
    revalidatePath("/find-jobs");
    revalidatePath("/dashboard");
    return reply(result, result.success ? 200 : 503);
  } catch {
    console.error("[agent/find] Request failed");
    return reply({ success: false, error: "Search was interrupted. Reload to check saved jobs before retrying." }, 500);
  }
}
