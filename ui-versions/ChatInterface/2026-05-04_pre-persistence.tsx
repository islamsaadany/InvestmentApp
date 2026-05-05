"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { Send, Loader2, Trash2, BriefcaseBusiness } from "lucide-react";
import MessageBubble from "./MessageBubble";
import type { ExpertMode } from "@/lib/types";

interface ChatInterfaceProps {
  mode: ExpertMode;
}

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

export default function ChatInterface({ mode }: ChatInterfaceProps) {
  const [includePortfolio, setIncludePortfolio] = useState(true);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const welcomeMessage = WELCOME_BY_MODE[mode];

  const { messages, sendMessage, status, setMessages } = useChat({
    id: `expert-chat-${mode}`,
    transport: useMemo(
      () =>
        new TextStreamChatTransport({
          api: "/api/expert/chat",
          body: { includePortfolio, mode },
        }),
      [includePortfolio, mode]
    ),
    messages: [
      {
        id: `welcome-${mode}`,
        role: "assistant" as const,
        content: welcomeMessage,
        parts: [{ type: "text" as const, text: welcomeMessage }],
      },
    ],
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    setMessages([
      {
        id: `cleared-${mode}`,
        role: "assistant",
        content: "Chat cleared. How can I help you?",
        parts: [{ type: "text", text: "Chat cleared. How can I help you?" }],
      },
    ]);
  };

  const getMessageText = (msg: (typeof messages)[number]): string => {
    if (msg.parts && msg.parts.length > 0) {
      return msg.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("");
    }
    return msg.content;
  };

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
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role as "user" | "assistant"}
            content={getMessageText(msg)}
          />
        ))}
        {isLoading &&
          messages.length > 0 &&
          (messages[messages.length - 1] as { role: string })?.role === "user" && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Analyzing</span>
                  <span className="animate-pulse">...</span>
                </div>
              </div>
            </div>
          )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDER_BY_MODE[mode]}
            rows={1}
            className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-h-32"
            style={{ minHeight: "44px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Shift+Enter for new line · Enter to send · AI responses are not
          financial advice
        </p>
      </div>
    </div>
  );
}
