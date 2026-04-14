import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const PERIOD_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

export async function GET(req: NextRequest) {
  try {
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

    // Filter out weekend dips: if a snapshot's value is less than 30% of
    // its nearest non-dip neighbor, it's likely a weekend artifact
    // (missing stock/metal prices). Remove these points.
    const filtered = snapshots.filter((s, i) => {
      if (snapshots.length < 3) return true;

      // Find the nearest non-zero neighbor value
      let neighborValue = 0;
      if (i > 0) neighborValue = snapshots[i - 1].totalValueUsd;
      else if (i < snapshots.length - 1) neighborValue = snapshots[i + 1].totalValueUsd;

      // If this value is less than 30% of its neighbor, it's a weekend dip
      if (neighborValue > 0 && s.totalValueUsd < neighborValue * 0.3) {
        return false;
      }
      return true;
    });

    return NextResponse.json(
      filtered.map((s) => ({
        id: s.id,
        totalValueUsd: s.totalValueUsd,
        totalValueEgp: s.totalValueEgp,
        snapshotDate: s.snapshotDate.toISOString(),
      }))
    );
  } catch (error: any) {
    console.error("GET /api/portfolio/performance error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
