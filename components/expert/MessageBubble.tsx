"use client";

import { User, Brain } from "lucide-react";
import RecommendationCard, { type Recommendation } from "./RecommendationCard";

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

// Splits assistant content into prose segments and recommendation cards.
// Streaming-safe: an unclosed <recommendation> block at the tail is hidden
// until its closing tag arrives, so users never see half-written JSON.
type Segment =
  | { kind: "prose"; text: string }
  | { kind: "rec"; data: Recommendation };

function parseAssistantContent(raw: string): Segment[] {
  const segments: Segment[] = [];
  const openTag = "<recommendation>";
  const closeTag = "</recommendation>";

  let cursor = 0;
  while (cursor < raw.length) {
    const openIdx = raw.indexOf(openTag, cursor);
    if (openIdx === -1) {
      const tail = raw.slice(cursor);
      if (tail.trim()) segments.push({ kind: "prose", text: tail });
      break;
    }

    // Prose before the block
    if (openIdx > cursor) {
      const before = raw.slice(cursor, openIdx);
      if (before.trim()) segments.push({ kind: "prose", text: before });
    }

    const closeIdx = raw.indexOf(closeTag, openIdx + openTag.length);
    if (closeIdx === -1) {
      // Block not yet closed (still streaming). Hide it for now.
      break;
    }

    const jsonRaw = raw.slice(openIdx + openTag.length, closeIdx).trim();
    try {
      const data = JSON.parse(jsonRaw) as Recommendation;
      segments.push({ kind: "rec", data });
    } catch {
      // Malformed JSON — fall back to showing the raw block as prose so
      // the user still sees the agent's intent.
      segments.push({ kind: "prose", text: `${openTag}\n${jsonRaw}\n${closeTag}` });
    }

    cursor = closeIdx + closeTag.length;
  }

  return segments;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex gap-3 justify-end">
        <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-blue-600 text-white">
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {formatContent(content)}
          </div>
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <User className="w-4 h-4 text-blue-600" />
        </div>
      </div>
    );
  }

  const segments = parseAssistantContent(content);
  const hasCards = segments.some((s) => s.kind === "rec");

  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
        <Brain className="w-4 h-4 text-purple-600" />
      </div>
      <div className={`${hasCards ? "max-w-[92%] w-full" : "max-w-[80%]"} space-y-2`}>
        {segments.map((seg, i) =>
          seg.kind === "prose" ? (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-gray-900"
            >
              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words font-mono text-[13px]">
                {formatContent(seg.text)}
              </div>
            </div>
          ) : (
            <RecommendationCard key={i} rec={seg.data} />
          )
        )}
      </div>
    </div>
  );
}
