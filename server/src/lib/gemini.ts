import { config } from "./config.js";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

export async function generateWithGemini(
  prompt: string,
  options: { json?: boolean } = {},
) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.GEMINI_MODEL)}:generateContent`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": config.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: options.json ? 8192 : 4096,
        ...(options.json ? { responseMimeType: "application/json" } : {}),
      },
    }),
  });

  const payload = (await response.json()) as GeminiResponse;
  if (!response.ok) {
    const message =
      payload.error?.message || `Gemini API request failed with ${response.status}`;
    throw new Error(`Gemini API error: ${message}`);
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}
