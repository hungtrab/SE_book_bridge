// Stub of @prisma/client used by Vitest before `prisma generate` has run.
//
// We only export the *types* the tests reference. State machine tests use
// the string literals directly, so the runtime values are not needed.

export type TransactionStatus =
  | "PENDING" | "ACCEPTED" | "DECLINED" | "WAITLISTED"
  | "IN_DELIVERY" | "COMPLETED" | "CANCELLED" | "DISPUTED";

export type UserRole = "GUEST" | "USER" | "MODERATOR" | "ADMIN";

export class PrismaClient {
  // empty — tests don't touch the DB.
}
