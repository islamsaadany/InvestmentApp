"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Briefcase, Bell, TrendingUp, LogOut } from "lucide-react";
import axios from "axios";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/investments", label: "Investments", icon: Briefcase },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

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
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-8 px-2">
        <TrendingUp className="w-7 h-7 text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900">InvestTracker</h1>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 mt-4 border-t border-gray-100 pt-4"
      >
        <LogOut className="w-5 h-5" />
        {loggingOut ? "Signing out..." : "Sign Out"}
      </button>
    </aside>
  );
}
