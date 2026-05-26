import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { getAIModel, getCurrentProvider } from "@/lib/ai-provider";
import { buildFullSystemPrompt, type ExpertMode } from "@/lib/expert-prompts";
import { prisma } from "@/lib/db";
import { enrichInvestments } from "@/lib/enrich";
import { getCurrentPrice } from "@/lib/market-data";
import { getBdsList } from "@/lib/bds-screener";

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

    const t0 = Date.now();
    const { messages, includePortfolio, applyBdsFilter, mode } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return jsonError("Messages are required", 400);
    }

    const expertMode: ExpertMode = VALID_MODES.includes(mode)
      ? (mode as ExpertMode)
      : "options";

    // Build context
    let portfolioContext: string | undefined;
    if (includePortfolio) {
      const tPortfolio = Date.now();
      const investments = await prisma.investment.findMany({
        orderBy: { createdAt: "desc" },
      });
      const enriched = await enrichInvestments(investments);
      portfolioContext = formatPortfolioContext(enriched);
      console.log(
        `[chat] portfolio enrich (${investments.length} positions) took ${Date.now() - tPortfolio}ms`
      );
    }

    const tWatchlist = Date.now();
    const watchlist = await prisma.watchlist.findMany({
      where: { category: MODE_TO_CATEGORY[expertMode] },
      orderBy: { addedAt: "desc" },
    });
    const watchlistContext = formatWatchlistContext(watchlist);
    console.log(`[chat] watchlist fetch took ${Date.now() - tWatchlist}ms`);

    // BDS filter only applies to US Stocks mode currently. Build the exclusion
    // context only when the user has toggled it on for that mode.
    let bdsContext: string | undefined;
    if (applyBdsFilter && expertMode === "us-stocks") {
      const bdsList = getBdsList();
      const lines = bdsList.map(
        (b) =>
          `- ${b.ticker} (${b.companyName}) — ${b.category}: ${b.reason}`
      );
      bdsContext =
        "The user has activated a BDS-related ethical screening filter. The following US-listed companies are on the user's exclusion list:\n\n" +
        lines.join("\n") +
        "\n\nRules:\n" +
        "1. DO NOT recommend any of these tickers in Discover Mode.\n" +
        "2. If the user asks about one of these tickers in Analyze Mode, you MUST: (a) acknowledge the BDS listing up front, (b) explain briefly why it is listed, (c) provide your analysis only if the user explicitly asks for it after seeing the BDS notice, (d) suggest one or two Halal alternatives that are NOT on the BDS list.\n" +
        "3. When recommending Halal alternatives, double-check they are NOT on this exclusion list before emitting a <recommendation> block.\n" +
        "4. The frontend will display a BDS badge on the card regardless of your output, so be honest with the user — never hide a listed status.";
    }

    const systemPrompt = buildFullSystemPrompt(
      expertMode,
      portfolioContext,
      watchlistContext || undefined,
      bdsContext
    );
    console.log(
      `[chat] systemPrompt built: ${systemPrompt.length} chars (mode=${expertMode}, includePortfolio=${!!portfolioContext})`
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

    // Loosen Gemini safety thresholds. Defaults block most halal-finance
    // prompts ("should I buy BTC?") with empty completions because they
    // trigger DANGEROUS_CONTENT. BLOCK_ONLY_HIGH still blocks egregious
    // content but allows analytical answers the app is designed to give.
    const providerOptions =
      getCurrentProvider() === "google"
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

    // Tools — let the agent fetch live prices so it doesn't anchor to stale
    // training-data prices when generating entry/target/stop levels.
    const tools = {
      get_current_price: tool({
        description:
          "Fetch the live current market price for a ticker. Use this BEFORE quoting any entry zone, 12-month target, or stop level for a stock, so your levels are anchored to today's price (not your training data). Returns priceUsd as a number, or null if unavailable.",
        inputSchema: z.object({
          ticker: z
            .string()
            .describe('Ticker symbol, e.g. "MSFT", "JNJ", "AAPL".'),
          assetType: z
            .enum(["us_stock", "egx_stock", "crypto", "gold", "silver"])
            .describe(
              'Asset type. For US stocks use "us_stock". For Egyptian stocks use "egx_stock".'
            )
            .default("us_stock"),
        }),
        execute: async ({ ticker, assetType }) => {
          const tTool = Date.now();
          try {
            const price = await getCurrentPrice(assetType, ticker);
            console.log(
              `[chat] tool get_current_price(${assetType}, ${ticker}) → ${price} in ${Date.now() - tTool}ms`
            );
            if (price == null) {
              return {
                ticker,
                assetType,
                priceUsd: null,
                error: "Price unavailable",
              };
            }
            return {
              ticker,
              assetType,
              priceUsd: Math.round(price * 10000) / 10000,
              fetchedAt: new Date().toISOString(),
            };
          } catch (err) {
            console.error(`[chat] tool get_current_price error:`, err);
            return {
              ticker,
              assetType,
              priceUsd: null,
              error: err instanceof Error ? err.message : "fetch failed",
            };
          }
        },
      }),
    };

    const tStream = Date.now();
    const result = streamText({
      model,
      system: systemPrompt,
      messages: normalized,
      tools,
      // Default is stepCountIs(1) — without this the model would emit tool
      // calls and stop without producing the final text response. Allow up to
      // 5 steps so the model can call get_current_price for multiple tickers
      // (e.g. 3-5 stocks in Discover mode) then write its answer.
      stopWhen: stepCountIs(5),
      providerOptions,
      onError: ({ error: streamError }) => {
        console.error("streamText runtime error:", streamError);
      },
      onFinish: ({ finishReason, usage, text }) => {
        console.log(
          `[chat] onFinish: finishReason=${finishReason}, ` +
            `inputTokens=${usage?.inputTokens ?? "?"}, ` +
            `outputTokens=${usage?.outputTokens ?? "?"}, ` +
            `textLen=${text?.length ?? 0}`
        );
      },
    });

    // Manually consume textStream so we can:
    //   1. Log timing of first/last token (helps diagnose hangs in Vercel logs)
    //   2. Detect zero-token completions and emit a visible marker so the
    //      client never sees a silent empty stream.
    const encoder = new TextEncoder();
    const totalRequestStart = t0;
    const readable = new ReadableStream({
      async start(controller) {
        let chunkCount = 0;
        let totalChars = 0;
        let firstChunkAt: number | null = null;
        try {
          for await (const chunk of result.textStream) {
            if (firstChunkAt === null) {
              firstChunkAt = Date.now();
              console.log(
                `[chat] first token at ${firstChunkAt - tStream}ms after streamText, ${firstChunkAt - totalRequestStart}ms total`
              );
            }
            chunkCount++;
            totalChars += chunk.length;
            controller.enqueue(encoder.encode(chunk));
          }
          if (chunkCount === 0) {
            // Gather every signal the SDK exposes so the chat bubble itself
            // explains why the response was empty (Vercel logs aren't always
            // accessible). finishReason, usage, warnings, and Gemini's
            // providerMetadata (which carries safetyRatings + blockReason)
            // all get dumped inline.
            let reason: string | undefined;
            let usage: unknown;
            let warnings: unknown;
            let providerMetadata: unknown;
            try {
              reason = await result.finishReason;
            } catch {
              // ignore
            }
            try {
              usage = await result.usage;
            } catch {
              // ignore
            }
            try {
              warnings = await result.warnings;
              if (
                Array.isArray(warnings) &&
                (warnings as unknown[]).length > 0
              ) {
                console.error(
                  "[chat] streamText warnings:",
                  JSON.stringify(warnings)
                );
              }
            } catch {
              // ignore
            }
            try {
              providerMetadata = await result.providerMetadata;
            } catch {
              // ignore
            }
            const elapsedMs = Date.now() - tStream;
            const diagnostic = {
              finishReason: reason ?? "unknown",
              usage,
              warnings,
              providerMetadata,
              elapsedMs,
              systemPromptChars: systemPrompt.length,
              mode: expertMode,
              includePortfolio: !!portfolioContext,
            };
            let headline: string;
            if (reason === "content-filter") {
              headline = `blocked by Gemini safety filter (finishReason=content-filter). Try rephrasing as analysis (not a buy/sell ask), or switch AI_PROVIDER to "anthropic"/"openai".`;
            } else if (reason === "length") {
              headline = `hit max output tokens with no text (finishReason=length). System prompt may be too long — try turning off the Portfolio toggle.`;
            } else if (reason) {
              headline = `stream finished with 0 tokens after ${elapsedMs}ms (finishReason=${reason}).`;
            } else {
              headline = `stream finished with 0 tokens after ${elapsedMs}ms — provider returned empty completion.`;
            }
            const marker =
              `\n\n[server: ${headline}]\n\n` +
              "```json\n" +
              JSON.stringify(diagnostic, null, 2) +
              "\n```";
            controller.enqueue(encoder.encode(marker));
            console.error(
              `[chat] zero-token completion`,
              JSON.stringify(diagnostic)
            );
          } else {
            console.log(
              `[chat] stream done: ${chunkCount} chunks / ${totalChars} chars in ${Date.now() - tStream}ms`
            );
          }
        } catch (streamErr) {
          const msg =
            streamErr instanceof Error
              ? streamErr.message
              : String(streamErr);
          console.error("[chat] stream consume error:", streamErr);
          controller.enqueue(
            encoder.encode(`\n\n[server: stream error — ${msg}]`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: unknown) {
    console.error("Expert chat error:", error);
    const raw =
      error instanceof Error ? error.message : "Internal server error";
    return jsonError(explainProviderError(raw), 500);
  }
}
