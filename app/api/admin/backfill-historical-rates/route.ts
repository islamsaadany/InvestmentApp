import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Free historical USD/EGP rates via fawazahmed0/exchange-api on jsDelivr.
 * No API key. Covers EGP back to early 2024.
 */
const RATE_API_BASE = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api";
const RATE_API_FALLBACK = "https://latest.currency-api.pages.dev";

async function fetchRateForDate(date: string): Promise<number | null> {
  const urls = [
    `${RATE_API_BASE}@${date}/v1/currencies/usd.json`,
    `${RATE_API_FALLBACK}/v1/currencies/usd.json`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const rate = json?.usd?.egp;
      if (typeof rate === "number" && rate > 0) return rate;
    } catch {
      // try next url
    }
  }
  return null;
}

/**
 * GET /api/admin/backfill-historical-rates
 *
 * One-time job: for every investment purchased in EGP with no stored
 * purchaseExchangeRate, fetch the historical USD→EGP rate for its
 * purchase date and persist it.
 *
 * Idempotent — re-hitting after backfill completes does nothing because
 * all rows already have a stored rate.
 */
export async function GET() {
  const candidates = await prisma.investment.findMany({
    where: {
      purchaseCurrency: "EGP",
      purchaseExchangeRate: null,
    },
    select: { id: true, name: true, purchaseDate: true, createdAt: true },
  });

  if (candidates.length === 0) {
    return NextResponse.json({
      message: "Nothing to backfill — all EGP investments already have a stored rate.",
      total: 0,
      updated: 0,
      failed: 0,
    });
  }

  const todayStr = new Date().toISOString().split("T")[0];
  let updated = 0;
  let failed = 0;
  const details: Array<{
    id: number;
    name: string;
    date: string;
    rate?: number;
    error?: string;
  }> = [];

  for (const inv of candidates) {
    const sourceDate = inv.purchaseDate || inv.createdAt;
    let dateStr = new Date(sourceDate).toISOString().split("T")[0];
    if (dateStr > todayStr) dateStr = todayStr;

    const rate = await fetchRateForDate(dateStr);
    if (rate == null) {
      failed++;
      details.push({
        id: inv.id,
        name: inv.name,
        date: dateStr,
        error: "no rate available for that date",
      });
      continue;
    }

    try {
      await prisma.investment.update({
        where: { id: inv.id },
        data: { purchaseExchangeRate: rate },
      });
      updated++;
      details.push({ id: inv.id, name: inv.name, date: dateStr, rate });
    } catch (err: unknown) {
      failed++;
      details.push({
        id: inv.id,
        name: inv.name,
        date: dateStr,
        error: err instanceof Error ? err.message : "db update failed",
      });
    }
  }

  return NextResponse.json({
    message: `Backfilled ${updated} of ${candidates.length} investments. ${failed > 0 ? `${failed} failed — see details.` : "All good."}`,
    total: candidates.length,
    updated,
    failed,
    details,
  });
}
