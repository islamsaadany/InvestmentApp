import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enrichInvestments, computeAllocation } from "@/lib/enrich";

export async function GET() {
  const investments = await prisma.investment.findMany();
  const enriched = await enrichInvestments(investments);
  const totalValue = enriched.reduce(
    (sum, i) => sum + (i.currentValueUsd || 0),
    0
  );
  return NextResponse.json(computeAllocation(enriched, totalValue));
}
