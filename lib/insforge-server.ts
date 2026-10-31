import "server-only";
import { createServerClient } from "@insforge/sdk/ssr";
import type { InsForgeClient } from "@insforge/sdk";
import { cookies } from "next/headers";

export async function createInsforgeServer(): Promise<InsForgeClient> {
  return createServerClient({ cookies: await cookies(), timeout: 10000, retryCount: 0 });
}
