import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * Returns `true` for any error that means "the database connection was
 * closed / killed / unavailable and a retry on a fresh connection is
 * likely to succeed". Neon serverless Postgres auto-suspends idle compute
 * and kills existing connections, so we see a zoo of error shapes.
 */
function isTransientConnectionError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const code = (error as unknown as { code?: string }).code;
  const msg = (error.message ?? "").toLowerCase();

  // Postgres error code for forced-close from the server.
  if (code === "57P01") return true;
  // Prisma engine error codes for lost / refused connections.
  if (code === "P1001" || code === "P1002" || code === "P1008" || code === "P1017") {
    return true;
  }

  // Common substrings from rust-layer / libpq / pgbouncer failures.
  const patterns = [
    "terminating connection due to administrator command",
    "error in postgresql connection",
    "kind: closed",
    "connection closed",
    "connection terminated",
    "connection reset",
    "connection refused",
    "server has closed the connection",
    "cannot assign requested address",
    "broken pipe",
    "socket hang up",
    "ecconnreset",
    "econnrefused",
    "etimedout",
  ];
  if (patterns.some((p) => msg.includes(p))) return true;

  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientRustPanicError) return true;

  return false;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function createClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  // Small retry loop around every Prisma operation. Up to three attempts
  // with exponential backoff (150ms → 400ms → 800ms) on transient
  // connection errors. This lets Neon spin its compute back up and give
  // us a healthy connection on retry.
  return client.$extends({
    query: {
      async $allOperations({ args, query }) {
        const maxAttempts = 3;
        let lastError: unknown;
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          try {
            return await query(args);
          } catch (error) {
            lastError = error;
            if (!isTransientConnectionError(error)) throw error;
            if (attempt < maxAttempts) {
              await sleep(attempt === 1 ? 150 : attempt === 2 ? 400 : 800);
            }
          }
        }
        throw lastError;
      },
    },
  }) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
