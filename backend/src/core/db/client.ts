// Prisma client singleton
// Follows core layer conventions in docs/source-tree.md

import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

export function getDbClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        // Note: do not log query parameters to avoid leaking sensitive data
        // Use minimal levels in production
        { level: "warn", emit: "event" },
        { level: "error", emit: "event" },
      ],
    });

    // Attach minimal event listeners without logging bindings/params
    prisma.$on("warn", (e) => {
      // eslint-disable-next-line no-console
      console.warn(`[DB warn] code=${e.code} message=${e.message}`);
    });
    prisma.$on("error", (e) => {
      // eslint-disable-next-line no-console
      console.error(`[DB error] code=${e.code} message=${e.message}`);
    });
  }
  return prisma;
}
