import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentPrice } from "@/lib/market-data";

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const alert = await prisma.priceAlert.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });

    const currentPrice = await getCurrentPrice(alert.assetType, alert.symbol);

    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error(`PUT /api/alerts/[id]/deactivate error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
