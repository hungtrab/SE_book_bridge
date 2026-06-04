import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import { listFeed, markFeedSeen, syncFeedForUser } from "@/server/feed/service";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const params = new URL(req.url).searchParams;
  await syncFeedForUser(user.id);
  return Response.json(await listFeed(user.id, params.get("cursor") ?? undefined, Number(params.get("pageSize") ?? 20)));
});

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown): id is string => typeof id === "string").slice(0, 100) : [];
  return Response.json(await markFeedSeen(user.id, ids));
});
