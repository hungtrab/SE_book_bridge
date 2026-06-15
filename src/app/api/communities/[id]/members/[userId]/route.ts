import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import {
  removeMember,
  grantCommunityModeratorById,
  revokeCommunityModerator,
} from "@/server/communities/service";

export const DELETE = withErrorHandling(async (_req: NextRequest, ctx: { params: Promise<{ id: string; userId: string }> }) => {
  const user = await requireUser();
  const { id, userId } = await ctx.params;
  return Response.json(await removeMember(user, id, userId));
});

export const PATCH = withErrorHandling(async (req: NextRequest, ctx: { params: Promise<{ id: string; userId: string }> }) => {
  const user = await requireUser();
  const { id, userId } = await ctx.params;
  const { role } = await req.json().catch(() => ({}));
  if (role === "MODERATOR") return Response.json(await grantCommunityModeratorById(user, id, userId));
  if (role === "MEMBER") return Response.json(await revokeCommunityModerator(user, id, userId));
  return Response.json({ error: "role must be MEMBER or MODERATOR" }, { status: 400 });
});
