import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/market/apply-split
 * Body: { investmentId, symbol, splitDate, ratio, numerator, denominator, newQuantity }
 *
 * Updates the investment's quantity to the post-split amount and records
 * the split as "applied" in `applied_splits` so it won't be re-surfaced.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      investmentId,
      symbol,
      splitDate,
      ratio,
      numerator,
      denominator,
      newQuantity,
    } = body;

    if (
      typeof investmentId !== "number" ||
      typeof symbol !== "string" ||
      typeof splitDate !== "string" ||
      typeof ratio !== "string" ||
      typeof numerator !== "number" ||
      typeof denominator !== "number" ||
      typeof newQuantity !== "number" ||
      newQuantity <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const investment = await prisma.investment.findUnique({
      where: { id: investmentId },
    });
    if (!investment) {
      return NextResponse.json(
        { error: "Investment not found" },
        { status: 404 }
      );
    }

    await prisma.investment.update({
      where: { id: investmentId },
      data: { quantity: newQuantity },
    });

    await prisma.appliedSplit.upsert({
      where: {
        symbol_splitDate_investmentId: {
          symbol,
          splitDate: new Date(splitDate),
          investmentId,
        },
      },
      update: {
        action: "applied",
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
        action: "applied",
        investmentId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/market/apply-split error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
