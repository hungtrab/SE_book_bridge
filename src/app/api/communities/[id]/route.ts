import { NextRequest } from "next/server";

import { getCurrentUser, requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { getCommunity, deleteCommunity } from "@/server/communities/service";

export const GET = withErrorHandling(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  const { id } = await ctx.params;
  return Response.json(await getCommunity(id, user?.id));
});

export const DELETE = withErrorHandling(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  return Response.json(await deleteCommunity(user, id));
});
