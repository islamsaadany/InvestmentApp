import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enrichInvestments, enrichInvestment } from "@/lib/enrich";

export async function GET(req: NextRequest) {
  const assetType = req.nextUrl.searchParams.get("assetType");
  const skip = parseInt(req.nextUrl.searchParams.get("skip") || "0");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100");

  const where = assetType ? { assetType: assetType as any } : {};

  const investments = await prisma.investment.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const enriched = await enrichInvestments(investments);
  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const investment = await prisma.investment.create({
    data: {
      name: body.name,
      symbol: body.symbol,
      assetType: body.assetType,
      quantity: body.quantity,
      purchasePrice: body.purchasePrice,
      purchaseCurrency: body.purchaseCurrency || "USD",
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      weightUnit: body.weightUnit || null,
      notes: body.notes || null,
    },
  });

  const enriched = await enrichInvestment(investment);
  return NextResponse.json(enriched, { status: 201 });
}
