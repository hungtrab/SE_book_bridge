import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { ReactionSchema, reactToComment } from "@/server/communities/service";

export const POST = withErrorHandling(async (
  req: NextRequest,
  ctx: { params: Promise<{ id: string; postId: string; commentId: string }> },
) => {
  const user = await requireUser();
  const { id, postId, commentId } = await ctx.params;
  const parsed = ReactionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Invalid reaction", details: parsed.error.format() }, { status: 400 });
  }
  return Response.json(await reactToComment(user, id, postId, commentId, parsed.data));
});
