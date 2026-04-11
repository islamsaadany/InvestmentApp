import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enrichInvestments, computeAllocation } from "@/lib/enrich";
import { getUsdToEgpRate } from "@/lib/market-data";

export async function GET() {
  try {
    const investments = await prisma.investment.findMany({
      orderBy: { createdAt: "desc" },
    });

    const enriched = await enrichInvestments(investments);
    const egpRate = await getUsdToEgpRate();

    const totalValueUsd = enriched.reduce(
      (sum, i) => sum + (i.currentValueUsd || 0),
      0
    );
    const totalValueEgp = totalValueUsd * egpRate;

    // Calculate total cost in USD
    let totalCostUsd = 0;
    for (const inv of enriched) {
      if (inv.totalCost) {
        totalCostUsd +=
          inv.purchaseCurrency === "EGP"
            ? inv.totalCost / egpRate
            : inv.totalCost;
      }
    }

    const totalProfitLossUsd = totalValueUsd - totalCostUsd;
    const totalProfitLossPct =
      totalCostUsd > 0 ? (totalProfitLossUsd / totalCostUsd) * 100 : 0;

    const allocation = computeAllocation(enriched, totalValueUsd);

    return NextResponse.json({
      totalValueUsd: Math.round(totalValueUsd * 100) / 100,
      totalValueEgp: Math.round(totalValueEgp * 100) / 100,
      totalCostUsd: Math.round(totalCostUsd * 100) / 100,
      totalProfitLossUsd: Math.round(totalProfitLossUsd * 100) / 100,
      totalProfitLossPct: Math.round(totalProfitLossPct * 100) / 100,
      usdToEgpRate: egpRate,
      investments: enriched,
      allocation,
    });
  } catch (error: any) {
    console.error("GET /api/portfolio/summary error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
