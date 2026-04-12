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
      return google(modelId);
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
