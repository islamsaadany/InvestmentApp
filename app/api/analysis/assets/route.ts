import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/analysis/assets
 * Returns the list of unique assets the user holds, grouped by type.
 * Used to populate the Analysis page filters.
 */
export async function GET() {
  try {
    const investments = await prisma.investment.findMany({
      select: {
        symbol: true,
        name: true,
        assetType: true,
      },
      orderBy: { assetType: "asc" },
    });

    // Deduplicate by symbol+assetType
    const seen = new Set<string>();
    const assets: { symbol: string; name: string; assetType: string; storeSymbol: string }[] = [];

    for (const inv of investments) {
      const key = `${inv.assetType}_${inv.symbol}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const storeSymbol =
        inv.assetType === "gold"
          ? "GOLD"
          : inv.assetType === "silver"
            ? "SILVER"
            : inv.symbol;

      assets.push({
        symbol: inv.symbol,
        name: inv.name,
        assetType: inv.assetType,
        storeSymbol,
      });
    }

    return NextResponse.json(assets);
  } catch (error: any) {
    console.error("GET /api/analysis/assets error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
