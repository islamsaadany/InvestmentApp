import { Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function cleanConnectionString(url: string | undefined): string | undefined {
  if (!url) return url;
  // Remove channel_binding param — it's a TCP feature unsupported by the WebSocket driver
  return url.replace(/[?&]channel_binding=[^&]*/g, "").replace(/\?&/, "?");
}

function createPrismaClient() {
  const connectionString = cleanConnectionString(process.env.DATABASE_URL);
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool as any);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
