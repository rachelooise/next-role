import type { ClientLLM } from "@browserbasehq/stagehand";
import type { ChatCompletion, ChatCompletionContentPart, ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { researchGemini, RESEARCH_MODEL } from "@/lib/research-clients";

// Stagehand's documented callback keeps model selection and credentials in the worker.
export const generateBrowserResearch: ClientLLM["generate"] = async (params): Promise<Awaited<ReturnType<ClientLLM["generate"]>>> => {
  if (params.responseFormat?.type !== "json_schema") throw new Error("Structured browser extraction is required");
  const messages: ChatCompletionMessageParam[] = [{ role: "system", content: `${params.systemPrompt || "Extract supported facts from the supplied page."}\nReturn only JSON matching this schema: ${JSON.stringify(params.responseFormat.schema)}` }];
  for (const message of params.messages) {
    const blocks = Array.isArray(message.content) ? message.content : [message.content];
    const content: ChatCompletionContentPart[] = blocks.map(block => {
      if (block.type === "text") return { type: "text", text: block.text };
      if (block.type === "image") return { type: "image_url", image_url: { url: `data:${block.mimeType};base64,${block.data}` } };
      throw new Error("Unsupported browser extraction input");
    });
    if (message.role === "assistant") messages.push({ role: "assistant", content: content.filter(part => part.type === "text").map(part => part.text).join("\n") });
    else messages.push({ role: "user", content });
  }
  let response: ChatCompletion;
  try {
    response = await researchGemini().chat.completions.create({ model: RESEARCH_MODEL, messages, response_format: { type: "json_object" }, temperature: 0.1, reasoning_effort: "low", max_tokens: 4000 }, { timeout: 20000 });
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : "unknown";
    throw new Error(`Browser Gemini unavailable (HTTP ${status})`);
  }
  const choice = response.choices[0];
  const text = choice?.message.content;
  if (choice?.finish_reason !== "stop" || !text) throw new Error("Incomplete browser extraction");
  return { role: "assistant", content: { type: "text", text }, outputFormat: "json_schema", structuredContent: JSON.parse(text) };
};
