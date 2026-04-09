import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import QueryProvider from "@/components/providers/QueryProvider";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "InvestTracker — Portfolio Tracker",
  description:
    "Track investments across Gold, Silver, Crypto, US Stocks, and Egyptian Stocks with live market data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-gray-50 text-gray-900">
        <QueryProvider>
          <CurrencyProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col">
                <TopBar />
                <main className="flex-1 p-6 overflow-auto">{children}</main>
              </div>
            </div>
            <Toaster position="top-right" />
          </CurrencyProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
