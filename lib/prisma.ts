import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { assertErasureReady } from "@/lib/erasure-gate";

const globalForPrisma = globalThis as unknown as {
  sukoonPrisma?: PrismaClient;
};

function createPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for the durable Sukoon store.");
  const adapter = new PrismaPg({ connectionString });
  const client = new PrismaClient({ adapter });
  return client.$extends({ query: { async $allOperations({ args, query }) {
    assertErasureReady();
    const result = await query(args);
    assertErasureReady();
    return result;
  } } }) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.sukoonPrisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.sukoonPrisma = prisma;
