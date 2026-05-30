// prisma.ts — singleton Prisma client.
//
// Next.js dev server hot-reloads modules; without this guard a new client
// is created on every reload and connection limits get exhausted.

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ?? new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
