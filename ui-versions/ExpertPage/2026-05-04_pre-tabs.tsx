"use client";

import WatchlistPanel from "@/components/expert/WatchlistPanel";
import ChatInterface from "@/components/expert/ChatInterface";

export default function ExpertPage() {
  return (
    <div className="flex h-[calc(100vh-theme(spacing.12))] -m-6 overflow-hidden">
      <WatchlistPanel />
      <ChatInterface />
    </div>
  );
}
