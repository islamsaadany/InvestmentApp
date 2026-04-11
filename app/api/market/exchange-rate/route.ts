import { NextResponse } from "next/server";
import { getUsdToEgpRate } from "@/lib/market-data";

export async function GET() {
  const rate = await getUsdToEgpRate();
  return NextResponse.json({
    usdToEgp: rate,
    lastUpdated: new Date().toISOString(),
  });
}
