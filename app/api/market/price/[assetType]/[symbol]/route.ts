import { NextRequest, NextResponse } from "next/server";
import { getCurrentPrice, getUsdToEgpRate } from "@/lib/market-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assetType: string; symbol: string }> }
) {
  const { assetType, symbol } = await params;
  const priceUsd = await getCurrentPrice(assetType, symbol);
  const egpRate = await getUsdToEgpRate();

  if (priceUsd == null) {
    return NextResponse.json({
      symbol,
      assetType,
      priceUsd: null,
      priceEgp: null,
      error: "Price unavailable",
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    symbol,
    assetType,
    priceUsd: Math.round(priceUsd * 10000) / 10000,
    priceEgp: Math.round(priceUsd * egpRate * 10000) / 10000,
    timestamp: new Date().toISOString(),
  });
}
