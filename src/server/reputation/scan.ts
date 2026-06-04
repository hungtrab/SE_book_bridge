import { prisma } from "../lib/prisma";
import { findLowDiversityUsers, findReciprocalOnlyPairs } from "./anti-gaming";

export async function runAntiGamingScan() {
  const recentFlagBoundary = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const transactions = await prisma.transaction.findMany({
    where: { status: "COMPLETED" },
    select: { id: true, ownerId: true, requesterId: true },
  });
  const input = transactions.map((txn) => ({
    transactionId: txn.id,
    ownerId: txn.ownerId,
    requesterId: txn.requesterId,
  }));
  const pairs = findReciprocalOnlyPairs(input);
  const lowDiversity = findLowDiversityUsers(input);
  const flags = new Map<string, string[]>();
  for (const [a, b] of pairs) {
    flags.set(a, [...(flags.get(a) ?? []), `reciprocal-only pair with ${b}`]);
    flags.set(b, [...(flags.get(b) ?? []), `reciprocal-only pair with ${a}`]);
  }
  for (const userId of lowDiversity) {
    flags.set(userId, [...(flags.get(userId) ?? []), "fewer than two unique counterparties"]);
  }
  let created = 0;
  for (const [userId, reasons] of flags) {
    const exists = await prisma.report.findFirst({
      where: {
        targetUserId: userId,
        isSystemGenerated: true,
        reason: "ANTI_GAMING_FLAG",
        OR: [{ status: "PENDING" }, { createdAt: { gte: recentFlagBoundary } }],
      },
      select: { id: true },
    });
    if (exists) continue;
    await prisma.report.create({
      data: {
        isSystemGenerated: true,
        targetType: "USER",
        targetUserId: userId,
        reason: "ANTI_GAMING_FLAG",
        details: reasons.join("; "),
      },
    });
    created += 1;
  }
  return { scannedTransactions: transactions.length, flaggedUsers: flags.size, reportsCreated: created };
}
