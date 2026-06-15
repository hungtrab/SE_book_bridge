import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { regenerateInviteCode } from "@/server/communities/service";

export const POST = withErrorHandling(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  return Response.json(await regenerateInviteCode(user, id));
});
