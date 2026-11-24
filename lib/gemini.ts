import "server-only";
import OpenAI from "openai";

export const GEMINI_EXTRACTION_MODEL = "gemini-3.5-flash-lite";

export function createGemini(): OpenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
  return new OpenAI({
    apiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    timeout: 45000,
    maxRetries: 0,
  });
}

