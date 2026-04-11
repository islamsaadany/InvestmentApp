import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const PERIOD_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") || "30d";

  const where: Record<string, any> = {};
  if (period !== "all" && PERIOD_DAYS[period]) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - PERIOD_DAYS[period]);
    where.snapshotDate = { gte: cutoff };
  }

  const snapshots = await prisma.portfolioSnapshot.findMany({
    where,
    orderBy: { snapshotDate: "asc" },
  });

  return NextResponse.json(
    snapshots.map((s) => ({
      id: s.id,
      totalValueUsd: s.totalValueUsd,
      totalValueEgp: s.totalValueEgp,
      snapshotDate: s.snapshotDate.toISOString(),
    }))
  );
}
