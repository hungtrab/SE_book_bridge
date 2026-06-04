import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { joinCommunity } from "@/server/communities/service";

export const POST = withErrorHandling(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  return Response.json(await joinCommunity(user.id, id));
});
