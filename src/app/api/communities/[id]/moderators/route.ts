import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import {
  CommunityModeratorGrantSchema,
  grantCommunityModerator,
  revokeCommunityModerator,
} from "@/server/communities/service";

export const POST = withErrorHandling(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const parsed = CommunityModeratorGrantSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
  }
  return Response.json(await grantCommunityModerator(user, id, parsed.data));
});

export const DELETE = withErrorHandling(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const { userId } = await req.json().catch(() => ({}));
  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });
  return Response.json(await revokeCommunityModerator(user, id, userId));
});
