import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const FRANKFURTER_BASE = "https://api.frankfurter.app";

/**
 * POST /api/admin/backfill-historical-rates
 *
 * One-shot job: for every investment that was purchased in EGP and has no
 * stored purchaseExchangeRate, fetch the historical USD→EGP rate from
 * Frankfurter for its purchase date and persist it.
 *
 * Returns a summary of how many rows were updated, skipped, and failed.
 *
 * Body (optional): { dryRun?: boolean }  — when true, fetches rates but does not write
 */
export async function POST(req: NextRequest) {
  let dryRun = false;
  try {
    const body = await req.json().catch(() => ({}));
    dryRun = !!body?.dryRun;
  } catch {
    // ignore
  }

  const candidates = await prisma.investment.findMany({
    where: {
      purchaseCurrency: "EGP",
      purchaseExchangeRate: null,
    },
    select: { id: true, purchaseDate: true, createdAt: true },
  });

  if (candidates.length === 0) {
    return NextResponse.json({
      total: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      details: [],
      dryRun,
    });
  }

  const todayStr = new Date().toISOString().split("T")[0];
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const details: Array<{ id: number; date: string; rate?: number; error?: string }> = [];

  for (const inv of candidates) {
    const sourceDate = inv.purchaseDate || inv.createdAt;
    if (!sourceDate) {
      skipped++;
      details.push({ id: inv.id, date: "—", error: "no purchase date" });
      continue;
    }
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

      if (!dryRun) {
        await prisma.investment.update({
          where: { id: inv.id },
          data: { purchaseExchangeRate: rate },
        });
      }
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
    total: candidates.length,
    updated,
    skipped,
    failed,
    dryRun,
    details,
  });
}
