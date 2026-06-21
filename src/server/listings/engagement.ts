import type { ListingEngagementKind } from "@prisma/client";
import { z } from "zod";

import { BadRequestError, NotFoundError } from "../lib/errors";
import { prisma } from "../lib/prisma";

export const ListingEngagementSchema = z.object({
  kind: z.enum(["LIKE", "WISHLIST"]),
});

export async function setListingEngagement(
  userId: string,
  listingId: string,
  kind: ListingEngagementKind,
  active: boolean,
) {
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, status: { not: "REMOVED" } },
    select: { id: true, ownerId: true },
  });
  if (!listing) throw new NotFoundError("Listing not found");
  if (listing.ownerId === userId) throw new BadRequestError("You cannot engage with your own listing");

  if (active) {
    await prisma.listingEngagement.upsert({
      where: { userId_listingId_kind: { userId, listingId, kind } },
      create: { userId, listingId, kind },
      update: {},
    });
  } else {
    await prisma.listingEngagement.deleteMany({ where: { userId, listingId, kind } });
  }

  const count = await prisma.listingEngagement.count({ where: { listingId, kind } });
  return { active, count };
}

export async function listingEngagementSummary(listingId: string, userId?: string) {
  const [likes, wishlists, mine] = await Promise.all([
    prisma.listingEngagement.count({ where: { listingId, kind: "LIKE" } }),
    prisma.listingEngagement.count({ where: { listingId, kind: "WISHLIST" } }),
    userId
      ? prisma.listingEngagement.findMany({
          where: { listingId, userId },
          select: { kind: true },
        })
      : Promise.resolve([]),
  ]);
  return {
    likes,
    wishlists,
    liked: mine.some((row) => row.kind === "LIKE"),
    wishlisted: mine.some((row) => row.kind === "WISHLIST"),
  };
}
