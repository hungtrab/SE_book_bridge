import type { Prisma, ReputationKind } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { NotFoundError } from "../lib/errors";
import { dispatchNotifications } from "../notifications/dispatcher";
import { tierForScore, tierLabel } from "./scoring";

export async function addReputationEvent(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    kind: ReputationKind;
    delta: number;
    context?: Prisma.InputJsonValue;
    actorId?: string;
  },
) {
  const user = await tx.user.findUnique({
    where: { id: input.userId },
    select: { reputationScore: true, reputationTier: true },
  });
  if (!user) throw new NotFoundError("User not found");

  const nextScore = Math.max(0, Math.min(100, user.reputationScore + input.delta));
  const effectiveDelta = nextScore - user.reputationScore;
  const nextTier = tierForScore(nextScore);
  const event = await tx.reputationEvent.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      delta: effectiveDelta,
      context: input.context,
    },
  });
  await tx.user.update({
    where: { id: input.userId },
    data: { reputationScore: nextScore, reputationTier: nextTier },
  });
  if (nextTier !== user.reputationTier) {
    await dispatchNotifications(tx, {
      kind: "reputation.tier_changed",
      actorId: input.actorId ?? "system",
      userId: input.userId,
      tier: nextTier,
    });
  }
  return { event, score: nextScore, tier: nextTier, effectiveDelta };
}

export async function getReputation(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, displayName: true, reputationScore: true, reputationTier: true },
  });
  if (!user) throw new NotFoundError("User not found");
  const [groups, recentEvents] = await Promise.all([
    prisma.reputationEvent.groupBy({
      by: ["kind"],
      where: { userId },
      _sum: { delta: true },
      _count: true,
    }),
    prisma.reputationEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  const tier = tierForScore(user.reputationScore);
  return {
    userId: user.id,
    displayName: user.displayName,
    score: user.reputationScore,
    tier,
    tierLabel: tierLabel(tier),
    breakdown: groups.map((group) => ({
      kind: group.kind,
      delta: group._sum.delta ?? 0,
      count: group._count,
    })),
    recentEvents,
  };
}
