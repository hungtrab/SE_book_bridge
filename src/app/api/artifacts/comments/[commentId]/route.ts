import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { deleteArtifactComment } from "@/server/artifacts/comments";

export const DELETE = withErrorHandling(async (
  _req: NextRequest,
  ctx: { params: Promise<{ commentId: string }> },
) => {
  const user = await requireUser();
  const { commentId } = await ctx.params;
  return Response.json(await deleteArtifactComment(
    commentId,
    user.id,
    user.role === "ADMIN" || user.role === "MODERATOR",
  ));
});
