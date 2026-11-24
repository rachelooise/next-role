import { PostHog } from "posthog-node";

export async function captureCompanyResearched(userId: string, jobId: string, company: string): Promise<void> {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!token || !host) return;
  let client: PostHog | undefined;
  try {
    client = new PostHog(token, { host, flushAt: 1, flushInterval: 0, requestTimeout: 3000, fetchRetryCount: 0 });
    client.on("error", () => console.error("[research/analytics] Event delivery failed"));
    client.capture({ distinctId: userId, event: "company_researched", properties: { userId, jobId, company } });
  } catch { console.error("[research/analytics] Event capture failed"); }
  finally {
    try { await client?.shutdown(5000); } catch { console.error("[research/analytics] Event flush failed"); }
  }
}
