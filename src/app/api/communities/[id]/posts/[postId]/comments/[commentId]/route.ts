import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { deleteComment } from "@/server/communities/service";

export const DELETE = withErrorHandling(async (_req: NextRequest, ctx: { params: Promise<{ id: string; postId: string; commentId: string }> }) => {
  const user = await requireUser();
  const { id, postId, commentId } = await ctx.params;
  return Response.json(await deleteComment(user, id, postId, commentId));
});
