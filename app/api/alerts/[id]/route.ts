import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentPrice } from "@/lib/market-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const alert = await prisma.priceAlert.findUnique({
    where: { id: parseInt(id) },
  });

  if (!alert) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.priceAlert.delete({ where: { id: parseInt(id) } });
  return new NextResponse(null, { status: 204 });
}
