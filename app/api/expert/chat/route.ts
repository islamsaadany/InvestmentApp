import { streamText } from "ai";
import { getAIModel } from "@/lib/ai-provider";
import { buildFullSystemPrompt } from "@/lib/expert-prompts";
import { prisma } from "@/lib/db";
import { enrichInvestments } from "@/lib/enrich";

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
    const { messages, includePortfolio } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

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
      orderBy: { addedAt: "desc" },
    });
    const watchlistContext = formatWatchlistContext(watchlist);

    const systemPrompt = buildFullSystemPrompt(
      portfolioContext,
      watchlistContext || undefined
    );

    const model = getAIModel();

    const result = streamText({
      model,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    console.error("Expert chat error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
