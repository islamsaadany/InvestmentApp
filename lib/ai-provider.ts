import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

type AIProvider = "anthropic" | "google" | "openai";

const PROVIDER_DEFAULTS: Record<AIProvider, string> = {
  anthropic: "claude-opus-4-20250514",
  google: "gemini-2.0-flash",
  openai: "gpt-4o",
};

export function getAIModel(): LanguageModel {
  const provider = (process.env.AI_PROVIDER || "anthropic") as AIProvider;
  const modelId = process.env.AI_MODEL || PROVIDER_DEFAULTS[provider];

  switch (provider) {
    case "anthropic":
      return anthropic(modelId);
    case "google":
      // Loosen Gemini's safety filters. The defaults are strict enough that
      // financial-advice prompts (e.g. "should I buy BTC?") often return
      // empty completions because they trigger the DANGEROUS_CONTENT filter.
      // BLOCK_ONLY_HIGH still blocks egregious cases but allows the
      // halal-investing analysis the app is built around.
      return google(modelId, {
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_ONLY_HIGH",
          },
        ],
      });
    case "openai":
      return openai(modelId);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

export function getProviderName(): string {
  const provider = (process.env.AI_PROVIDER || "anthropic") as AIProvider;
  const modelId = process.env.AI_MODEL || PROVIDER_DEFAULTS[provider];
  return `${provider}/${modelId}`;
}
