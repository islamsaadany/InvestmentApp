import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/market/skip-split
 * Body: { investmentId, symbol, splitDate, ratio, numerator, denominator }
 *
 * Records the split as "skipped" so it won't be re-surfaced. Quantity is
 * left untouched.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { investmentId, symbol, splitDate, ratio, numerator, denominator } =
      body;

    if (
      typeof investmentId !== "number" ||
      typeof symbol !== "string" ||
      typeof splitDate !== "string" ||
      typeof ratio !== "string" ||
      typeof numerator !== "number" ||
      typeof denominator !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    await prisma.appliedSplit.upsert({
      where: {
        symbol_splitDate_investmentId: {
          symbol,
          splitDate: new Date(splitDate),
          investmentId,
        },
      },
      update: {
        action: "skipped",
        ratio,
        numerator,
        denominator,
      },
      create: {
        symbol,
        splitDate: new Date(splitDate),
        ratio,
        numerator,
        denominator,
        action: "skipped",
        investmentId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/market/skip-split error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
