import "server-only";
import { PostHog } from "posthog-node";

export type DiscoveryEvent = { event: "job_search_started" | "job_found"; timestamp: Date; properties: Record<string, string | number> };

export async function captureDiscoveryEvents(userId: string, events: DiscoveryEvent[]): Promise<void> {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!token || !host) { console.error("[posthog/server] Product event configuration missing"); return; }
  let client: PostHog | undefined;
  try {
    client = new PostHog(token, { host, flushAt: 1, flushInterval: 0, requestTimeout: 3000, fetchRetryCount: 0 });
    client.on("error", () => console.error("[posthog/server] Product event delivery failed"));
    for (const item of events) client.capture({ distinctId: userId, event: item.event, timestamp: item.timestamp, properties: { ...item.properties, userId } });
  } catch { console.error("[posthog/server] Could not capture product events"); }
  finally {
    try { await client?.shutdown(5000); } catch { console.error("[posthog/server] Product event flush failed"); }
  }
}
