import OpenAI from "openai";
import { config } from "./config.js";

export const openrouter =
  config.AI_PROVIDER === "openrouter"
    ? new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: config.OPENROUTER_API_KEY,
        defaultHeaders: {
          "HTTP-Referer": config.FRONTEND_ORIGIN,
          "X-OpenRouter-Title": "Future Path AI",
        },
      })
    : null;

export async function generateOpenRouterText(
  messages: Array<{ role: "system" | "user"; content: string }>,
  options: { json?: boolean } = {},
) {
  if (!openrouter) throw new Error("OpenRouter client is not configured");

  const completion = await openrouter.chat.completions.create({
    model: config.OPENROUTER_MODEL,
    messages,
    temperature: 0.25,
    max_tokens: options.json ? 8192 : 4096,
    ...(options.json
      ? { response_format: { type: "json_object" as const } }
      : {}),
  });

  const content = completion.choices[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenRouter returned an empty response");
  }
  return content.trim();
}
