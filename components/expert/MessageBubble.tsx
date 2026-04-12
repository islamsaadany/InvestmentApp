"use client";

import { User, Brain } from "lucide-react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

function formatContent(text: string): string {
  // Convert === headers === to bold
  let formatted = text.replace(/^===\s*(.+?)\s*===$/gm, "**$1**");
  // Convert --- dividers
  formatted = formatted.replace(/^-{3,}$/gm, "───────────────────");
  return formatted;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";
  const formatted = formatContent(content);

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <Brain className="w-4 h-4 text-purple-600" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-white border border-gray-200 text-gray-900"
        }`}
      >
        <div
          className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser ? "" : "font-mono text-[13px]"
          }`}
        >
          {formatted}
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <User className="w-4 h-4 text-blue-600" />
        </div>
      )}
    </div>
  );
}
