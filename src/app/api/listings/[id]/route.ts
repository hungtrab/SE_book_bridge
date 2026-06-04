import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import {
  deleteListing,
  getListing,
  ListingPatchSchema,
  patchListing,
} from "@/server/listings/service";

export const GET = withErrorHandling(
  async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    const listing = await getListing(id);
    return Response.json(listing);
  },
);

export const PATCH = withErrorHandling(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const parsed = ListingPatchSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 },
      );
    }
    const listing = await patchListing(user, id, parsed.data);
    return Response.json(listing);
  },
);

export const DELETE = withErrorHandling(
  async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const out = await deleteListing(user, id);
    return Response.json(out);
  },
);
