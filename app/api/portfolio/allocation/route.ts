import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enrichInvestments, computeAllocation } from "@/lib/enrich";

export async function GET() {
  try {
    const investments = await prisma.investment.findMany();
    const enriched = await enrichInvestments(investments);
    const totalValue = enriched.reduce(
      (sum, i) => sum + (i.currentValueUsd || 0),
      0
    );
    return NextResponse.json(computeAllocation(enriched, totalValue));
  } catch (error: any) {
    console.error("GET /api/portfolio/allocation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
