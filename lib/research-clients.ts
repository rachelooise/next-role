// Worker clients deliberately have no Next.js server-only marker: Trigger runs in Node.
import { createAdminClient, type InsForgeClient } from "@insforge/sdk";
import OpenAI from "openai";

export const RESEARCH_MODEL = "gemini-3.5-flash-lite";

export function researchDatabase(): InsForgeClient {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const apiKey = process.env.INSFORGE_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("Research database is not configured");
  return createAdminClient({ baseUrl, apiKey, timeout: 10000, retryCount: 0 });
}

export function researchGemini(): OpenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Research Gemini is not configured");
  return new OpenAI({ apiKey, baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/", timeout: 45000, maxRetries: 0 });
}
