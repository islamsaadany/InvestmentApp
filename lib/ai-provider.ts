import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel, SharedV3ProviderOptions } from "ai";

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
      return google(modelId);
    case "openai":
      return openai(modelId);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

// Per-provider runtime options passed to streamText({ providerOptions }).
// Loosened Gemini safety thresholds live here because the defaults block
// most halal-finance prompts ("should I buy BTC?") with empty completions.
// BLOCK_ONLY_HIGH still blocks egregious content but allows the analytical
// answers the app is designed to give.
export function getProviderOptions(): SharedV3ProviderOptions {
  const provider = (process.env.AI_PROVIDER || "anthropic") as AIProvider;
  if (provider === "google") {
    return {
      google: {
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
      },
    };
  }
  return {};
}

export function getProviderName(): string {
  const provider = (process.env.AI_PROVIDER || "anthropic") as AIProvider;
  const modelId = process.env.AI_MODEL || PROVIDER_DEFAULTS[provider];
  return `${provider}/${modelId}`;
}
