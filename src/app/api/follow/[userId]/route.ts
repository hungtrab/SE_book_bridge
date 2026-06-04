import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { unfollowUser } from "@/server/social/follow";

export const DELETE = withErrorHandling(async (_req: Request, ctx: { params: Promise<{ userId: string }> }) => {
  const user = await requireUser();
  const { userId } = await ctx.params;
  return Response.json(await unfollowUser(user.id, userId));
});
