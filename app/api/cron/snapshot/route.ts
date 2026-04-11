import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enrichInvestments } from "@/lib/enrich";
import { getUsdToEgpRate } from "@/lib/market-data";

export async function GET(req: NextRequest) {
  // Verify cron secret in production
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const investments = await prisma.investment.findMany();
  const enriched = await enrichInvestments(investments);
  const egpRate = await getUsdToEgpRate();

  const totalUsd = enriched.reduce(
    (sum, i) => sum + (i.currentValueUsd || 0),
    0
  );

  const snapshot = await prisma.portfolioSnapshot.create({
    data: {
      totalValueUsd: Math.round(totalUsd * 100) / 100,
      totalValueEgp: Math.round(totalUsd * egpRate * 100) / 100,
    },
  });

  return NextResponse.json({
    id: snapshot.id,
    totalValueUsd: snapshot.totalValueUsd,
    totalValueEgp: snapshot.totalValueEgp,
    snapshotDate: snapshot.snapshotDate.toISOString(),
  });
}
