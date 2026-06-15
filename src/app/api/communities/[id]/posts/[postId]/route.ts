import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { deleteCommunityPost, pinCommunityPost } from "@/server/communities/service";

export const DELETE = withErrorHandling(async (_req: NextRequest, ctx: { params: Promise<{ id: string; postId: string }> }) => {
  const user = await requireUser();
  const { id, postId } = await ctx.params;
  return Response.json(await deleteCommunityPost(user, id, postId));
});

export const PATCH = withErrorHandling(async (req: NextRequest, ctx: { params: Promise<{ id: string; postId: string }> }) => {
  const user = await requireUser();
  const { id, postId } = await ctx.params;
  const { isPinned } = await req.json().catch(() => ({}));
  if (typeof isPinned !== "boolean") return Response.json({ error: "isPinned (boolean) required" }, { status: 400 });
  return Response.json(await pinCommunityPost(user, id, postId, isPinned));
});
