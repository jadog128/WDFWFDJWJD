import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL || "postgresql://postgres.zzqbkaumedxdrvpqxszw:adawradaw%20ffwufwgagfag@zzqbkaumedxdrvpqxszw.pooler.supabase.com:5432/postgres?pgbouncer=true&sslmode=verify-full";
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
