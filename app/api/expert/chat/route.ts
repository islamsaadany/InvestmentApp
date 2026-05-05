import { streamText } from "ai";
import { getAIModel } from "@/lib/ai-provider";
import { buildFullSystemPrompt, type ExpertMode } from "@/lib/expert-prompts";
import { prisma } from "@/lib/db";
import { enrichInvestments } from "@/lib/enrich";

// Streaming responses can run longer than the 10s Vercel Hobby default.
// 60s is the Hobby-plan ceiling and is plenty for Gemini Flash replies.
export const maxDuration = 60;

const VALID_MODES: ExpertMode[] = ["options", "us-stocks", "crypto"];

const MODE_TO_CATEGORY = {
  options: "options",
  "us-stocks": "us_stocks",
  crypto: "crypto",
} as const;

const PROVIDER_TO_KEY: Record<string, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
  openai: "OPENAI_API_KEY",
};

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function explainProviderError(raw: string): string {
  if (/api[_\s-]?key|unauthor|401|403/i.test(raw)) {
    return `AI provider rejected the API key. Verify the key is valid and the Gemini API is enabled on the Google Cloud project that owns it. Underlying error: ${raw}`;
  }
  if (/429|rate.?limit|quota|exceed/i.test(raw)) {
    return `Rate limit hit on AI provider. Wait a moment and retry. Underlying error: ${raw}`;
  }
  if (/timeout|timed out|deadline/i.test(raw)) {
    return `AI provider timed out. The model may be overloaded — retry, or set AI_MODEL to a faster model (e.g. gemini-2.0-flash). Underlying error: ${raw}`;
  }
  return raw;
}

function formatPortfolioContext(
  investments: Array<{
    name: string;
    symbol: string;
    assetType: string;
    quantity: number;
    currentPrice?: number | null;
    currentValueUsd?: number | null;
    profitLoss?: number | null;
    profitLossPct?: number | null;
  }>
): string {
  if (investments.length === 0) return "No investments in portfolio.";

  const lines = investments.map((inv) => {
    const price = inv.currentPrice ? `$${inv.currentPrice.toFixed(2)}` : "N/A";
    const value = inv.currentValueUsd
      ? `$${inv.currentValueUsd.toFixed(2)}`
      : "N/A";
    const pl =
      inv.profitLoss != null
        ? `${inv.profitLoss >= 0 ? "+" : ""}$${inv.profitLoss.toFixed(2)} (${inv.profitLossPct?.toFixed(1)}%)`
        : "N/A";
    return `- ${inv.name} (${inv.symbol}) | Type: ${inv.assetType} | Qty: ${inv.quantity} | Price: ${price} | Value: ${value} | P&L: ${pl}`;
  });

  return `Portfolio Holdings (${investments.length} positions):\n${lines.join("\n")}`;
}

function formatWatchlistContext(
  watchlist: Array<{ symbol: string; name: string | null }>
): string {
  if (watchlist.length === 0) return "";
  const symbols = watchlist
    .map((w) => (w.name ? `${w.symbol} (${w.name})` : w.symbol))
    .join(", ");
  return `Watchlist: ${symbols}`;
}

export async function POST(req: Request) {
  try {
    // Precheck: required AI provider key must be set. Surface a specific,
    // actionable message instead of letting the SDK throw a generic auth error.
    const provider = process.env.AI_PROVIDER || "anthropic";
    const requiredKey = PROVIDER_TO_KEY[provider];
    if (!requiredKey) {
      return jsonError(
        `Unsupported AI_PROVIDER "${provider}". Set AI_PROVIDER to one of: ${Object.keys(PROVIDER_TO_KEY).join(", ")}.`,
        503
      );
    }
    if (!process.env[requiredKey]) {
      return jsonError(
        `AI not configured: ${requiredKey} is not set. Add it in Vercel → Project → Settings → Environment Variables (Production, Preview, and Development), then redeploy.`,
        503
      );
    }

    const { messages, includePortfolio, mode } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return jsonError("Messages are required", 400);
    }

    const expertMode: ExpertMode = VALID_MODES.includes(mode)
      ? (mode as ExpertMode)
      : "options";

    // Build context
    let portfolioContext: string | undefined;
    if (includePortfolio) {
      const investments = await prisma.investment.findMany({
        orderBy: { createdAt: "desc" },
      });
      const enriched = await enrichInvestments(investments);
      portfolioContext = formatPortfolioContext(enriched);
    }

    const watchlist = await prisma.watchlist.findMany({
      where: { category: MODE_TO_CATEGORY[expertMode] },
      orderBy: { addedAt: "desc" },
    });
    const watchlistContext = formatWatchlistContext(watchlist);

    const systemPrompt = buildFullSystemPrompt(
      expertMode,
      portfolioContext,
      watchlistContext || undefined
    );

    const model = getAIModel();

    // Client sends UIMessages from @ai-sdk/react v6 with `parts: [{type:"text",
    // text: ...}]` and no top-level `content`. Older callers may still send
    // `content`. Normalize to plain text either way.
    type IncomingMessage = {
      role: string;
      content?: string;
      parts?: Array<{ type: string; text?: string }>;
    };
    const normalized = (messages as IncomingMessage[])
      .map((m) => {
        const fromParts =
          m.parts
            ?.filter((p) => p.type === "text" && typeof p.text === "string")
            .map((p) => p.text!)
            .join("") ?? "";
        const text = fromParts || m.content || "";
        return {
          role: m.role as "user" | "assistant",
          content: text,
        };
      })
      .filter((m) => m.content.length > 0);

    if (normalized.length === 0) {
      return jsonError("No message content to send to the AI agent.", 400);
    }

    const result = streamText({
      model,
      system: systemPrompt,
      messages: normalized,
      onError: ({ error: streamError }) => {
        console.error("streamText runtime error:", streamError);
      },
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    console.error("Expert chat error:", error);
    const raw =
      error instanceof Error ? error.message : "Internal server error";
    return jsonError(explainProviderError(raw), 500);
  }
}
