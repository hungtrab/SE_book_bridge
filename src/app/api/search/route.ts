import { NextRequest } from "next/server";

import { withErrorHandling } from "@/server/lib/errors";
import { searchListings, SearchSchema } from "@/server/search/service";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const params = new URL(req.url).searchParams;
  const parsed = SearchSchema.safeParse({
    q: params.get("q") || undefined,
    genre: params.get("genre") || undefined,
    author: params.get("author") || undefined,
    isbn: params.get("isbn") || undefined,
    condition: params.get("condition") || undefined,
    transactionType: params.get("type") || undefined,
    maxPrice: params.get("maxPrice") || undefined,
    communityId: params.get("communityId") || undefined,
    district: params.get("district") || undefined,
    distanceKm: params.get("distanceKm") || undefined,
    cursor: params.get("cursor") || undefined,
    pageSize: params.get("pageSize") || undefined,
  });
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
  }
  return Response.json(await searchListings(parsed.data));
});
