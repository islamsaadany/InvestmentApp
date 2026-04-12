import { readFileSync } from "fs";
import { join } from "path";

let cachedKB: string | null = null;
let cachedSystemPrompt: string | null = null;

function readTextFile(filename: string): string {
  const filePath = join(process.cwd(), "lib", "expert", filename);
  return readFileSync(filePath, "utf-8");
}

export function getKnowledgeBase(): string {
  if (!cachedKB) {
    cachedKB = readTextFile("kb.txt");
  }
  return cachedKB;
}

export function getSystemPrompt(): string {
  if (!cachedSystemPrompt) {
    cachedSystemPrompt = readTextFile("system-prompt.txt");
  }
  return cachedSystemPrompt;
}

export function buildFullSystemPrompt(portfolioContext?: string, watchlistContext?: string): string {
  const parts: string[] = [];

  parts.push(getSystemPrompt());
  parts.push("\n\n--- KNOWLEDGE BASE ---\n\n");
  parts.push(getKnowledgeBase());

  if (portfolioContext) {
    parts.push("\n\n--- USER'S CURRENT PORTFOLIO ---\n\n");
    parts.push(portfolioContext);
  }

  if (watchlistContext) {
    parts.push("\n\n--- USER'S WATCHLIST ---\n\n");
    parts.push(watchlistContext);
  }

  return parts.join("");
}
