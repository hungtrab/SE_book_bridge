import { NextRequest } from "next/server";

import { requireUser } from "@/server/lib/auth-context";
import { withErrorHandling } from "@/server/lib/errors";
import {
  createListing,
  ListingCreateSchema,
  searchListings,
} from "@/server/listings/service";


export const GET = withErrorHandling(async (req: NextRequest) => {
  const url = new URL(req.url);
  const params = url.searchParams;
  const items = await searchListings({
    q:               params.get("q") ?? undefined,
    genre:           params.get("genre") ?? undefined,
    condition:       params.get("condition") ?? undefined,
    transactionType: params.get("type") ?? undefined,
    maxPrice:        params.get("maxPrice") ? Number(params.get("maxPrice")) : undefined,
    communityId:     params.get("communityId") ?? undefined,
    cursor:          params.get("cursor") ?? undefined,
    pageSize:        params.get("pageSize") ? Number(params.get("pageSize")) : undefined,
  });
  return Response.json({ items });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const parsed = ListingCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 },
    );
  }
  const listing = await createListing(user, parsed.data);
  return Response.json(listing, { status: 201 });
});
