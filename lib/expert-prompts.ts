import { readFileSync, existsSync } from "fs";
import { join } from "path";

export type ExpertMode = "options" | "us-stocks" | "crypto";

const FILE_MAP: Record<ExpertMode, { systemPrompt: string; kb: string }> = {
  options: {
    systemPrompt: "system-prompt.txt",
    kb: "kb.txt",
  },
  "us-stocks": {
    systemPrompt: "us-stocks-system-prompt.txt",
    kb: "Knowledge Base for a Halal US Stock Purchase Agent.md",
  },
  crypto: {
    systemPrompt: "crypto-system-prompt.txt",
    kb: "Knowledge Base for a Halal Crypto Purchase Advisor.md",
  },
};

const promptCache = new Map<string, string>();

function readTextFile(filename: string): string {
  if (promptCache.has(filename)) {
    return promptCache.get(filename)!;
  }
  const filePath = join(process.cwd(), "lib", "expert", filename);
  if (!existsSync(filePath)) {
    return "";
  }
  const content = readFileSync(filePath, "utf-8");
  promptCache.set(filename, content);
  return content;
}

export function getSystemPrompt(mode: ExpertMode): string {
  return readTextFile(FILE_MAP[mode].systemPrompt);
}

export function getKnowledgeBase(mode: ExpertMode): string {
  return readTextFile(FILE_MAP[mode].kb);
}

export function buildFullSystemPrompt(
  mode: ExpertMode,
  portfolioContext?: string,
  watchlistContext?: string,
  bdsContext?: string
): string {
  const parts: string[] = [];

  const systemPrompt = getSystemPrompt(mode);
  if (systemPrompt) {
    parts.push(systemPrompt);
  }

  const kb = getKnowledgeBase(mode);
  if (kb) {
    parts.push("\n\n--- KNOWLEDGE BASE ---\n\n");
    parts.push(kb);
  }

  if (portfolioContext) {
    parts.push("\n\n--- USER'S CURRENT PORTFOLIO ---\n\n");
    parts.push(portfolioContext);
  }

  if (watchlistContext) {
    parts.push("\n\n--- USER'S WATCHLIST ---\n\n");
    parts.push(watchlistContext);
  }

  if (bdsContext) {
    parts.push("\n\n--- BDS FILTER (USER-ACTIVATED) ---\n\n");
    parts.push(bdsContext);
  }

  return parts.join("");
}
