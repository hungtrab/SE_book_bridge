import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import {
  ListingEngagementSchema,
  listingEngagementSummary,
  setListingEngagement,
} from "@/server/listings/engagement";

export const GET = withErrorHandling(async (
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  return Response.json(await listingEngagementSummary(id, user.id));
});

export const POST = withErrorHandling(async (
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const parsed = ListingEngagementSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "Invalid engagement" }, { status: 400 });
  return Response.json(await setListingEngagement(user.id, id, parsed.data.kind, true));
});

export const DELETE = withErrorHandling(async (
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const kind = new URL(req.url).searchParams.get("kind");
  const parsed = ListingEngagementSchema.safeParse({ kind });
  if (!parsed.success) return Response.json({ error: "Invalid engagement" }, { status: 400 });
  return Response.json(await setListingEngagement(user.id, id, parsed.data.kind, false));
});
