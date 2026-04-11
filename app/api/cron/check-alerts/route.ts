import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentPrice, getUsdToEgpRate } from "@/lib/market-data";

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret in production
    const authHeader = req.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeAlerts = await prisma.priceAlert.findMany({
      where: { isActive: true, isTriggered: false },
    });

    if (activeAlerts.length === 0) {
      return NextResponse.json({ triggered: 0, checked: 0 });
    }

    const egpRate = await getUsdToEgpRate();
    let triggeredCount = 0;

    for (const alert of activeAlerts) {
      const priceUsd = await getCurrentPrice(alert.assetType, alert.symbol);
      if (priceUsd == null) continue;

      const currentPrice =
        alert.currency === "EGP" ? priceUsd * egpRate : priceUsd;

      const shouldTrigger =
        (alert.condition === "above" && currentPrice >= alert.targetPrice) ||
        (alert.condition === "below" && currentPrice <= alert.targetPrice);

      if (shouldTrigger) {
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: { isTriggered: true },
        });
        triggeredCount++;
      }
    }

    return NextResponse.json({
      checked: activeAlerts.length,
      triggered: triggeredCount,
    });
  } catch (error: any) {
    console.error("GET /api/cron/check-alerts error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
