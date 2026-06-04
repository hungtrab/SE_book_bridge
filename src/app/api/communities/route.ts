import { NextRequest } from "next/server";

import { getCurrentUser, requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import {
  CommunityCreateSchema,
  CommunityQuerySchema,
  createCommunity,
  listCommunities,
} from "@/server/communities/service";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getCurrentUser();
  const params = new URL(req.url).searchParams;
  const parsed = CommunityQuerySchema.safeParse({
    q: params.get("q") ?? undefined,
    scope: params.get("scope") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
  }
  return Response.json({ items: await listCommunities(parsed.data, user?.id) });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const parsed = CommunityCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
  }
  return Response.json(await createCommunity(user, parsed.data), { status: 201 });
});
