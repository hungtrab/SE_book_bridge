import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { leaveCommunity } from "@/server/communities/service";

export const POST = withErrorHandling(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  return Response.json(await leaveCommunity(user.id, id));
});
