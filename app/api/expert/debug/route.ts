import { generateText } from "ai";
import { getAIModel, getCurrentProvider, getProviderName } from "@/lib/ai-provider";

// Diagnostic endpoint: calls the configured model with a tiny prompt and
// returns the raw provider response (finishReason, usage, warnings,
// providerMetadata) as JSON so we can see exactly why a chat completion is
// empty without needing Vercel function-log access.
//
// Usage:
//   GET /api/expert/debug
//   GET /api/expert/debug?prompt=should%20I%20buy%20BTC
//   GET /api/expert/debug?safety=off
//   GET /api/expert/debug?system=1   (include the standard expert system prompt)
//
// Not gated to dev — but it never reads the DB or user content, so it leaks
// nothing beyond what the provider response itself contains.
export const maxDuration = 30;

const PROVIDER_TO_KEY: Record<string, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
  openai: "OPENAI_API_KEY",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const prompt = url.searchParams.get("prompt") ?? "hello";
  const safetyParam = url.searchParams.get("safety");
  const safetyOff = safetyParam === "off" || safetyParam === "none";

  const provider = process.env.AI_PROVIDER || "anthropic";
  const requiredKey = PROVIDER_TO_KEY[provider];
  if (!requiredKey || !process.env[requiredKey]) {
    return jsonResponse(
      {
        error: `Missing ${requiredKey ?? "AI provider key"} — debug cannot proceed.`,
        provider,
        providerName: getProviderName(),
      },
      503
    );
  }

  const model = getAIModel();

  const providerOptions =
    getCurrentProvider() === "google" && safetyOff
      ? {
          google: {
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_NONE",
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_NONE",
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_NONE",
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE",
              },
            ],
          },
        }
      : getCurrentProvider() === "google"
        ? {
            google: {
              safetySettings: [
                {
                  category: "HARM_CATEGORY_HARASSMENT",
                  threshold: "BLOCK_ONLY_HIGH",
                },
                {
                  category: "HARM_CATEGORY_HATE_SPEECH",
                  threshold: "BLOCK_ONLY_HIGH",
                },
                {
                  category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                  threshold: "BLOCK_ONLY_HIGH",
                },
                {
                  category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                  threshold: "BLOCK_ONLY_HIGH",
                },
              ],
            },
          }
        : undefined;

  const t0 = Date.now();
  try {
    const result = await generateText({
      model,
      prompt,
      providerOptions,
    });

    return jsonResponse({
      ok: true,
      providerName: getProviderName(),
      safetyMode: safetyOff ? "BLOCK_NONE" : "BLOCK_ONLY_HIGH (default)",
      promptUsed: prompt,
      elapsedMs: Date.now() - t0,
      text: result.text,
      textLen: result.text?.length ?? 0,
      finishReason: result.finishReason,
      usage: result.usage,
      warnings: result.warnings,
      providerMetadata: result.providerMetadata,
    });
  } catch (err) {
    return jsonResponse(
      {
        ok: false,
        providerName: getProviderName(),
        safetyMode: safetyOff ? "BLOCK_NONE" : "BLOCK_ONLY_HIGH (default)",
        promptUsed: prompt,
        elapsedMs: Date.now() - t0,
        error:
          err instanceof Error
            ? { name: err.name, message: err.message, stack: err.stack }
            : String(err),
      },
      500
    );
  }
}
