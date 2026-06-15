import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { CommunityPostCommentCreateSchema, createComment } from "@/server/communities/service";

export const POST = withErrorHandling(async (req: NextRequest, ctx: { params: Promise<{ id: string; postId: string }> }) => {
  const user = await requireUser();
  const { id, postId } = await ctx.params;
  const parsed = CommunityPostCommentCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
  }
  return Response.json(await createComment(user, id, postId, parsed.data), { status: 201 });
});
