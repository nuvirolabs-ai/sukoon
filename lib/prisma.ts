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

function livePrisma() {
  if (!globalForPrisma.sukoonPrisma) globalForPrisma.sukoonPrisma = createPrisma();
  return globalForPrisma.sukoonPrisma;
}

// A missing database must not crash the module graph. Queries still fail closed
// on the first call. When DATABASE_URL is set, the client is created immediately.
export const prisma: PrismaClient = process.env.DATABASE_URL
  ? livePrisma()
  : new Proxy({} as PrismaClient, {
      get(_target, prop, receiver) {
        const client = livePrisma();
        const value = Reflect.get(client, prop, receiver);
        return typeof value === "function" ? value.bind(client) : value;
      },
    });
