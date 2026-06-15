import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { likePost } from "@/server/communities/service";

export const POST = withErrorHandling(async (_req: NextRequest, ctx: { params: Promise<{ id: string; postId: string }> }) => {
  const user = await requireUser();
  const { id, postId } = await ctx.params;
  return Response.json(await likePost(user, id, postId));
});
