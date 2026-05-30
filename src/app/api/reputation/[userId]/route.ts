import { prisma } from "@/server/lib/prisma";
import { withErrorHandling, NotFoundError } from "@/server/lib/errors";
import { tierForScore, tierLabel } from "@/server/reputation/scoring";

export const GET = withErrorHandling(
  async (_req: Request, ctx: { params: Promise<{ userId: string }> }) => {
    const { userId } = await ctx.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, displayName: true, reputationScore: true },
    });
    if (!user) throw new NotFoundError("User not found");

    const events = await prisma.reputationEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const tier = tierForScore(user.reputationScore);
    return Response.json({
      userId: user.id,
      displayName: user.displayName,
      score: user.reputationScore,
      tier,
      tierLabel: tierLabel(tier),
      recentEvents: events.map((e) => ({
        kind: e.kind, delta: e.delta, createdAt: e.createdAt, context: e.context,
      })),
    });
  },
);
