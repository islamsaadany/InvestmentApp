"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Bell,
  TrendingUp,
  LogOut,
  Brain,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/investments", label: "Investments", icon: Briefcase },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/analysis", label: "Analysis", icon: BarChart3 },
  { href: "/expert", label: "Expert", icon: Brain },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await axios.post("/api/auth/logout");
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-64"
      } bg-slate-900 h-screen sticky top-0 p-3 flex flex-col transition-all duration-200`}
    >
      {/* Logo */}
      <div
        className={`flex items-center gap-2 mb-8 ${
          collapsed ? "justify-center px-0" : "px-2"
        }`}
      >
        <TrendingUp className="w-7 h-7 text-blue-400 flex-shrink-0" />
        {!collapsed && (
          <h1 className="text-xl font-bold text-white">InvestTracker</h1>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 flex-1">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 ${
                collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
              } rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="flex flex-col gap-1 border-t border-slate-700 pt-3 mt-3">
        {/* Refresh data */}
        <button
          onClick={async () => {
            if (refreshing) return;
            setRefreshing(true);
            try {
              // Record today's asset prices in background (lightweight, not full backfill)
              fetch("/api/cron/snapshot").catch(() => {});
              // Refresh all cached queries
              await queryClient.invalidateQueries();
              await queryClient.refetchQueries();
              const now = new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });
              toast.success(`Data refreshed · ${now}`);
            } catch {
              toast.error("Refresh failed — check your connection");
            } finally {
              setRefreshing(false);
            }
          }}
          disabled={refreshing}
          className={`flex items-center gap-3 ${
            collapsed ? "justify-center px-0" : "px-3"
          } py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50`}
          title="Refresh all data"
        >
          <RefreshCw
            className={`w-5 h-5 flex-shrink-0 ${refreshing ? "animate-spin" : ""}`}
          />
          {!collapsed && (refreshing ? "Refreshing..." : "Refresh")}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-3 ${
            collapsed ? "justify-center px-0" : "px-3"
          } py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-800 hover:text-white transition-colors`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-5 h-5 flex-shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="w-5 h-5 flex-shrink-0" />
              Collapse
            </>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title={collapsed ? "Sign Out" : undefined}
          className={`flex items-center gap-3 ${
            collapsed ? "justify-center px-0" : "px-3"
          } py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (loggingOut ? "Signing out..." : "Sign Out")}
        </button>
      </div>
    </aside>
  );
}
