import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const VALID_CATEGORIES = ["options", "us_stocks", "crypto"] as const;
type WatchlistCategory = (typeof VALID_CATEGORIES)[number];

function parseCategory(value: string | null | undefined): WatchlistCategory {
  if (value && (VALID_CATEGORIES as readonly string[]).includes(value)) {
    return value as WatchlistCategory;
  }
  return "options";
}

export async function GET(req: NextRequest) {
  try {
    const category = parseCategory(req.nextUrl.searchParams.get("category"));
    const watchlist = await prisma.watchlist.findMany({
      where: { category },
      orderBy: { addedAt: "desc" },
    });
    return NextResponse.json(watchlist);
  } catch (error: unknown) {
    console.error("GET /api/expert/watchlist error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const symbol = (body.symbol as string)?.toUpperCase().trim();
    const name = body.name?.trim() || null;
    const category = parseCategory(body.category);

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.watchlist.findUnique({
      where: { symbol_category: { symbol, category } },
    });

    if (existing) {
      return NextResponse.json(
        { error: `${symbol} is already in this watchlist` },
        { status: 409 }
      );
    }

    const item = await prisma.watchlist.create({
      data: { symbol, name, category },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/expert/watchlist error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const symbol = req.nextUrl.searchParams.get("symbol")?.toUpperCase();
    const category = parseCategory(req.nextUrl.searchParams.get("category"));

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol query parameter is required" },
        { status: 400 }
      );
    }

    await prisma.watchlist.delete({
      where: { symbol_category: { symbol, category } },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("DELETE /api/expert/watchlist error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
