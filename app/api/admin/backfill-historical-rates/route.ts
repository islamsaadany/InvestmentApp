import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const FRANKFURTER_BASE = "https://api.frankfurter.app";

/**
 * GET /api/admin/backfill-historical-rates
 *
 * One-time job: for every investment purchased in EGP with no stored
 * purchaseExchangeRate, fetch the historical USD→EGP rate from Frankfurter
 * for its purchase date and persist it.
 *
 * Idempotent — re-hitting after backfill completes does nothing because
 * all rows already have a stored rate.
 *
 * Visit this URL once in a browser after deploy. Returns a JSON summary.
 */
export async function GET() {
  const candidates = await prisma.investment.findMany({
    where: {
      purchaseCurrency: "EGP",
      purchaseExchangeRate: null,
    },
    select: { id: true, purchaseDate: true, createdAt: true },
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
  const details: Array<{ id: number; date: string; rate?: number; error?: string }> = [];

  for (const inv of candidates) {
    const sourceDate = inv.purchaseDate || inv.createdAt;
    let dateStr = new Date(sourceDate).toISOString().split("T")[0];
    if (dateStr > todayStr) dateStr = todayStr;

    try {
      const res = await fetch(`${FRANKFURTER_BASE}/${dateStr}?from=USD&to=EGP`);
      if (!res.ok) {
        failed++;
        details.push({ id: inv.id, date: dateStr, error: `HTTP ${res.status}` });
        continue;
      }
      const json = await res.json();
      const rate = json?.rates?.EGP;
      if (typeof rate !== "number" || rate <= 0) {
        failed++;
        details.push({ id: inv.id, date: dateStr, error: "no rate in response" });
        continue;
      }

      await prisma.investment.update({
        where: { id: inv.id },
        data: { purchaseExchangeRate: rate },
      });
      updated++;
      details.push({ id: inv.id, date: dateStr, rate });
    } catch (err: unknown) {
      failed++;
      details.push({
        id: inv.id,
        date: dateStr,
        error: err instanceof Error ? err.message : "fetch error",
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
