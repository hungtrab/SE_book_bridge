import { NextRequest } from "next/server";

import { withErrorHandling } from "@/server/lib/errors";
import { listPublicUserListings } from "@/server/users/service";

export const GET = withErrorHandling(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const cursor = new URL(req.url).searchParams.get("cursor") ?? undefined;
  return Response.json(await listPublicUserListings(id, cursor));
});
