import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env_database_url: process.env.DATABASE_URL ? "SET" : "NOT SET",
    node_version: process.version,
  };

  // Test DB connection
  try {
    const { prisma } = await import("@/lib/db");
    await prisma.$queryRawUnsafe("SELECT 1 AS ok");
    checks.database = "connected";
  } catch (error: any) {
    checks.database = "error";
    checks.db_error = error.message;
    checks.db_error_code = error.code;
  }

  const allOk = checks.database === "connected" && checks.env_database_url === "SET";

  return NextResponse.json(checks, { status: allOk ? 200 : 500 });
}
