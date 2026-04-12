"use client";

import { useState } from "react";
import WatchlistPanel from "@/components/expert/WatchlistPanel";
import ChatInterface from "@/components/expert/ChatInterface";

export default function ExpertPage() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] -m-6 overflow-hidden">
      <WatchlistPanel
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <ChatInterface />
    </div>
  );
}
