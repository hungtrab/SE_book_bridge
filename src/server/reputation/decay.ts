import { prisma } from "../lib/prisma";
import { addReputationEvent } from "./service";
import { ReputationWeights } from "./scoring";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function runReputationDecay(now = new Date()) {
  const candidates = await prisma.user.findMany({
    where: { status: "ACTIVE", reputationScore: { gt: 0 } },
    select: { id: true, status: true, reputationScore: true, createdAt: true, lastReputationEventAt: true },
  });
  const toDecay = candidates.filter((u) => shouldDecayUser(u, now));
  for (const user of toDecay) {
    await prisma.$transaction((tx) => addReputationEvent(tx, {
      userId: user.id,
      kind: "TIME_DECAY",
      delta: ReputationWeights.TIME_DECAY_PER_30_DAYS,
      context: { appliedAt: now.toISOString() },
    }));
  }
  return { decayedUsers: toDecay.length };
}

export function shouldDecayUser(
  user: {
    status: string;
    reputationScore: number;
    createdAt: Date;
    lastReputationEventAt: Date | null;
  },
  now = new Date(),
) {
  if (user.status !== "ACTIVE" || user.reputationScore <= 0) return false;
  const lastActivity = user.lastReputationEventAt ?? user.createdAt;
  return now.getTime() - lastActivity.getTime() >= THIRTY_DAYS_MS;
}
