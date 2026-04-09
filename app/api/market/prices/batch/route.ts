import { NextRequest, NextResponse } from "next/server";
import { getCurrentPrice, getUsdToEgpRate } from "@/lib/market-data";

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols") || "";
  const egpRate = await getUsdToEgpRate();

  const pairs = symbols
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.includes(":"));

  const results = await Promise.all(
    pairs.map(async (pair) => {
      const [assetType, symbol] = pair.split(":", 2);
      const priceUsd = await getCurrentPrice(assetType, symbol);
      return {
        symbol,
        assetType,
        priceUsd: priceUsd != null ? Math.round(priceUsd * 10000) / 10000 : null,
        priceEgp: priceUsd != null ? Math.round(priceUsd * egpRate * 10000) / 10000 : null,
      };
    })
  );

  return NextResponse.json({
    prices: results,
    usdToEgp: egpRate,
    timestamp: new Date().toISOString(),
  });
}
