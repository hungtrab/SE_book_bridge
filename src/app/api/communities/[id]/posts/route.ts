import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import {
  CommunityPostCreateSchema,
  createCommunityPost,
} from "@/server/communities/service";

export const POST = withErrorHandling(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const parsed = CommunityPostCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
  }
  return Response.json(await createCommunityPost(user, id, parsed.data), { status: 201 });
});
