import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const TURSO_URL = "libsql://app-mikefeufh.aws-eu-west-1.turso.io";
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODIyNDI3NDQsImlkIjoiMDE5ZWY1ZjEtZjcwMS03N2I4LTk4MzYtMDkyYzJlNjAzZWIxIiwicmlkIjoiZmIyYjZjMTAtY2QwNS00NmE0LWJjYTUtNjIyNGZiMTViNjhjIn0.6UAG4ZnukOXrAw4LXwdkp7-vX_dmuzn1i6l3drctHHO3vpEh37Bw2CdwttKxorB7nfgVT--icpDdMPGmVFQFCQ";

function createPrismaClient() {
  const adapter = new PrismaLibSql({
    url: TURSO_URL,
    authToken: TURSO_TOKEN,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
