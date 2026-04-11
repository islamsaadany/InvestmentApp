import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-full bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
