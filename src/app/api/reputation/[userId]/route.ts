import { withErrorHandling } from "@/server/lib/errors";
import { getReputation } from "@/server/reputation/service";

export const GET = withErrorHandling(
  async (_req: Request, ctx: { params: Promise<{ userId: string }> }) => {
    const { userId } = await ctx.params;
    return Response.json(await getReputation(userId));
  },
);
