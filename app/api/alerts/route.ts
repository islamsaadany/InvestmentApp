import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentPrice } from "@/lib/market-data";

export async function GET(req: NextRequest) {
  const isActive = req.nextUrl.searchParams.get("isActive");
  const isTriggered = req.nextUrl.searchParams.get("isTriggered");

  const where: Record<string, any> = {};
  if (isActive !== null) where.isActive = isActive === "true";
  if (isTriggered !== null) where.isTriggered = isTriggered === "true";

  const alerts = await prisma.priceAlert.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // Enrich with current prices
  const enriched = await Promise.all(
    alerts.map(async (alert) => {
      const currentPrice = await getCurrentPrice(alert.assetType, alert.symbol);
      return {
        id: alert.id,
        symbol: alert.symbol,
        assetType: alert.assetType,
        targetPrice: alert.targetPrice,
        condition: alert.condition,
        currency: alert.currency,
        isTriggered: alert.isTriggered,
        isActive: alert.isActive,
        createdAt: alert.createdAt.toISOString(),
        currentPrice,
      };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const alert = await prisma.priceAlert.create({
    data: {
      symbol: body.symbol,
      assetType: body.assetType,
      targetPrice: body.targetPrice,
      condition: body.condition,
      currency: body.currency || "USD",
    },
  });

  const currentPrice = await getCurrentPrice(alert.assetType, alert.symbol);

  return NextResponse.json(
    {
      id: alert.id,
      symbol: alert.symbol,
      assetType: alert.assetType,
      targetPrice: alert.targetPrice,
      condition: alert.condition,
      currency: alert.currency,
      isTriggered: alert.isTriggered,
      isActive: alert.isActive,
      createdAt: alert.createdAt.toISOString(),
      currentPrice,
    },
    { status: 201 }
  );
}
