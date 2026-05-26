"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import {
  Send,
  Loader2,
  Trash2,
  BriefcaseBusiness,
  AlertCircle,
  RefreshCw,
  Brain,
} from "lucide-react";
import MessageBubble from "./MessageBubble";
import type { ExpertMode } from "@/lib/types";

interface ChatInterfaceProps {
  mode: ExpertMode;
}

const STORAGE_VERSION = "v1";
const storageKey = (mode: ExpertMode) => `expert-chat-${mode}-${STORAGE_VERSION}`;

const WELCOME_BY_MODE: Record<ExpertMode, string> = {
  options: `⚠️ HALAL-OPT DISCLAIMER: I am an AI trading analysis agent. All output is for informational and educational purposes only — not financial advice. Options trading carries significant risk. You may lose the entire amount invested. Halal compliance should be independently verified. Consult a qualified financial advisor and Islamic scholar before trading.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Welcome! I'm your Halal Options Trading Expert. I can help you with:

• Analyze any Halal stock for options opportunities
• Recommend specific options strategies with full trade setups
• Evaluate existing positions (hold/sell/roll)
• Factor in your portfolio context for smarter recommendations

Try asking me something like:
  "Analyze AAPL for options opportunities"
  "What's a good iron condor setup for MSFT?"
  "Should I sell covered calls on my NVDA position?"`,

  "us-stocks": `⚠️ HALAL-EQUITY DISCLAIMER: I am an AI investment analysis agent. All output is for informational and educational purposes only — not financial advice. Investing in stocks carries risk of loss. Halal compliance can change quarter-to-quarter and should be independently verified through Zoya, Musaffa, or your scholar. Consult a qualified financial advisor and Islamic scholar before investing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Welcome! I'm your Halal US Stock Purchase Advisor. I can help you with:

• Analyze any specific stock for buying (verdict + entry zone + target)
• Suggest 3-5 Halal-compliant US stocks to buy now (Discover mode)
• Evaluate stocks you already own (hold/add/trim/sell)
• Factor in your portfolio for diversification and concentration checks

Try asking me something like:
  "Should I buy AAPL right now?"
  "Suggest 3 Halal US stocks to buy this month"
  "Is MSFT still a buy at this price?"`,

  crypto: `⚠️ HALAL-CRYPTO DISCLAIMER: I am an AI cryptocurrency analysis agent. All output is for informational and educational purposes only — not financial advice. Cryptocurrency investing carries extreme risk including total loss of capital. Halal compliance for cryptocurrencies is contested among scholars and must be independently verified with your own qualified scholar. Consult a qualified financial advisor before investing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Welcome! I'm your Halal Crypto Purchase Advisor. I can help you with:

• Analyze any specific coin for buying (with scholarly Halal view)
• Suggest 2-3 Halal-acceptable coins to buy now (Discover mode)
• Evaluate coins you already hold (hold/add/trim/sell + custody review)
• Factor in your portfolio for crypto allocation and tier balance

Try asking me something like:
  "Should I buy BTC at this price?"
  "What Halal crypto should I DCA into right now?"
  "Is ETH still acceptable from a Shariah perspective?"`,
};

const PLACEHOLDER_BY_MODE: Record<ExpertMode, string> = {
  options: "Ask about any stock... e.g. 'Analyze AAPL for options'",
  "us-stocks": "Ask about any stock... e.g. 'Should I buy AAPL?'",
  crypto: "Ask about any coin... e.g. 'Should I buy BTC right now?'",
};

// Map raw error text to a user-actionable hint. Server already enriches most
// cases (see app/api/expert/chat/route.ts), but we keep this fallback for
// network errors and provider errors that bubble up through the stream.
function explainError(message: string): string {
  const m = message || "Unknown error";
  if (/api[_\s-]?key|unauthor|401|403/i.test(m)) {
    return "AI provider rejected the API key. Check that GOOGLE_GENERATIVE_AI_API_KEY is set in Vercel env vars and the deployment was redeployed after adding it.";
  }
  if (/429|rate.?limit|quota|exceed/i.test(m)) {
    return "Rate limit hit on the AI provider. Wait a moment and try again.";
  }
  if (/network|fetch|failed to connect|enotfound|econnrefused/i.test(m)) {
    return "Network error reaching the AI provider. Check your connection and retry.";
  }
  if (/not configured|missing/i.test(m)) {
    return m;
  }
  return `Something went wrong: ${m}`;
}

export default function ChatInterface({ mode }: ChatInterfaceProps) {
  const [includePortfolio, setIncludePortfolio] = useState(true);
  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const welcomeMessage = WELCOME_BY_MODE[mode];

  const { messages, sendMessage, status, setMessages, error } = useChat({
    id: `expert-chat-${mode}`,
    transport: useMemo(
      () =>
        new TextStreamChatTransport({
          api: "/api/expert/chat",
          body: { includePortfolio, mode },
          // Wrap fetch so non-2xx responses surface as real errors with the
          // server's JSON message intact. Without this, the transport treats
          // a 503/500 JSON body as an empty stream and the user sees the
          // generic "no reply" timeout message instead of the actual cause.
          fetch: async (input, init) => {
            const response = await fetch(input, init);
            if (!response.ok) {
              let serverMessage = `Request failed (${response.status})`;
              try {
                const data = await response.clone().json();
                if (data?.error) serverMessage = String(data.error);
              } catch {
                try {
                  const text = await response.clone().text();
                  if (text) serverMessage = text;
                } catch {
                  // ignore
                }
              }
              throw new Error(serverMessage);
            }
            return response;
          },
        }),
      [includePortfolio, mode]
    ),
  });

  // Hydrate from localStorage on mount (client-only; avoids SSR mismatch).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey(mode));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // Corrupted entry — ignore and start fresh.
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist messages to localStorage on every change once hydrated.
  // Streams that get interrupted (component unmount mid-stream) save up to the
  // last received chunk, so partial answers survive page navigation.
  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined") return;
    try {
      if (messages.length === 0) {
        window.localStorage.removeItem(storageKey(mode));
      } else {
        window.localStorage.setItem(storageKey(mode), JSON.stringify(messages));
      }
    } catch {
      // Quota exceeded or storage disabled — silently drop.
    }
  }, [messages, mode, hydrated]);

  const isSubmitting = status === "submitted";
  const isStreaming = status === "streaming";
  const isLoading = isSubmitting || isStreaming;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const getMessageText = useCallback(
    (msg: (typeof messages)[number]): string => {
      if (!msg.parts || msg.parts.length === 0) return "";
      return msg.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("");
    },
    []
  );

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage({ text: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(storageKey(mode));
      } catch {
        // ignore
      }
    }
  };

  const handleRetry = () => {
    if (isLoading) return;
    // Find the most recent user message and replay it. If the failed assistant
    // turn is still present (empty/partial), drop it first so we don't
    // accumulate broken bubbles.
    const lastUserIdx = [...messages]
      .reverse()
      .findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const realIdx = messages.length - 1 - lastUserIdx;
    const lastUserMsg = messages[realIdx];
    const trimmedHistory = messages.slice(0, realIdx);
    setMessages(trimmedHistory);
    sendMessage({ text: getMessageText(lastUserMsg) });
  };

  // Hide the empty assistant placeholder bubble that useChat creates while a
  // request is in flight before any tokens arrive. The typing indicator covers
  // that period instead.
  const visibleMessages = messages.filter((msg) => {
    if (msg.role !== "assistant") return true;
    return getMessageText(msg).length > 0;
  });

  const hasInteracted = messages.some((m) => m.role === "user");
  const showWelcome = !hasInteracted;

  // Detect "the stream finished but the assistant produced no reply" — happens
  // when the serverless function times out mid-stream (Vercel kills the worker
  // after maxDuration) or when the provider returns an empty body. useChat
  // doesn't surface this as `error`, so we infer it from the message tail.
  const lastMsg = messages[messages.length - 1];
  const lastMsgText = lastMsg ? getMessageText(lastMsg) : "";
  const streamEndedEmpty =
    !isLoading &&
    hasInteracted &&
    !error &&
    (lastMsg?.role === "user" ||
      (lastMsg?.role === "assistant" && lastMsgText.trim().length === 0));

  const showErrorBanner = !isLoading && (Boolean(error) || streamEndedEmpty);
  const errorBannerMessage = error
    ? explainError(error.message)
    : "The AI agent didn't return any reply. The serverless function may have timed out (Vercel free tier caps streaming around 60s) or the provider returned an empty response. Check the Vercel function logs for `streamText runtime error`, then retry.";

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIncludePortfolio(!includePortfolio)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              includePortfolio
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-gray-100 text-gray-500 border border-gray-200"
            }`}
          >
            <BriefcaseBusiness className="w-3.5 h-3.5" />
            Portfolio {includePortfolio ? "ON" : "OFF"}
          </button>
        </div>
        <button
          onClick={handleClearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {showWelcome && (
          <MessageBubble role="assistant" content={welcomeMessage} />
        )}

        {visibleMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role as "user" | "assistant"}
            content={getMessageText(msg)}
          />
        ))}

        {/* Typing indicator: shown while the request is in flight but no
            assistant tokens have arrived yet. Streaming tokens take over once
            they start coming in (visibleMessages will include the assistant
            bubble as soon as it has text). */}
        {isLoading &&
          !visibleMessages.some(
            (m, idx) =>
              m.role === "assistant" && idx === visibleMessages.length - 1
          ) && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Brain className="w-4 h-4 text-purple-600" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

        {/* Error banner: surfaces failed requests with an actionable hint and
            a retry button. Covers both real errors from useChat and the
            "stream ended with no reply" timeout case. */}
        {showErrorBanner && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1 max-w-[80%] bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <div className="text-sm font-semibold text-red-800 mb-1">
                Couldn&apos;t get a reply
              </div>
              <div className="text-sm text-red-700 whitespace-pre-wrap">
                {errorBannerMessage}
              </div>
              {hasInteracted && (
                <button
                  onClick={handleRetry}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry last message
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDER_BY_MODE[mode]}
            rows={1}
            className="flex-1 resize-none border border-gray-300 rounded-xl px-3 sm:px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-h-32 min-w-0"
            style={{ minHeight: "44px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="Send"
            className="flex-shrink-0 bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="hidden sm:block text-xs text-gray-400 mt-2 text-center">
          Shift+Enter for new line · Enter to send · AI responses are not
          financial advice
        </p>
      </div>
    </div>
  );
}
