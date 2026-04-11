import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enrichInvestment } from "@/lib/enrich";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const investment = await prisma.investment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!investment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const enriched = await enrichInvestment(investment);
    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error(`GET /api/investments/[id] error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: Record<string, any> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.symbol !== undefined) data.symbol = body.symbol;
    if (body.quantity !== undefined) data.quantity = body.quantity;
    if (body.purchasePrice !== undefined) data.purchasePrice = body.purchasePrice;
    if (body.purchaseCurrency !== undefined) data.purchaseCurrency = body.purchaseCurrency;
    if (body.purchaseDate !== undefined) data.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null;
    if (body.weightUnit !== undefined) data.weightUnit = body.weightUnit;
    if (body.notes !== undefined) data.notes = body.notes;

    const investment = await prisma.investment.update({
      where: { id: parseInt(id) },
      data,
    });

    const enriched = await enrichInvestment(investment);
    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error(`PUT /api/investments/[id] error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.investment.delete({ where: { id: parseInt(id) } });
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error(`DELETE /api/investments/[id] error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
