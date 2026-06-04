import { prisma } from "../lib/prisma";
import { addReputationEvent } from "./service";
import { ReputationWeights } from "./scoring";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function runReputationDecay(now = new Date()) {
  const inactiveBefore = new Date(now.getTime() - THIRTY_DAYS_MS);
  const users = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      reputationScore: { gt: 0 },
      OR: [
        { reputationEvents: { none: {} }, createdAt: { lt: inactiveBefore } },
        { reputationEvents: { every: { createdAt: { lt: inactiveBefore } } } },
      ],
    },
    select: { id: true },
  });
  for (const user of users) {
    await prisma.$transaction((tx) => addReputationEvent(tx, {
      userId: user.id,
      kind: "TIME_DECAY",
      delta: ReputationWeights.TIME_DECAY_PER_30_DAYS,
      context: { appliedAt: now.toISOString() },
    }));
  }
  return { decayedUsers: users.length };
}
