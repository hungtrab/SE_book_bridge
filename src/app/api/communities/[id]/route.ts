import { getCurrentUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { getCommunity } from "@/server/communities/service";

export const GET = withErrorHandling(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  const { id } = await ctx.params;
  return Response.json(await getCommunity(id, user?.id));
});
