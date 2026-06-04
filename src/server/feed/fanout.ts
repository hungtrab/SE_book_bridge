import type { Prisma } from "@prisma/client";

export async function fanoutExistingListingsToUser(
  tx: Prisma.TransactionClient,
  userId: string,
  source: { followeeId?: string; communityId?: string },
) {
  const listings = await tx.listing.findMany({
    where: {
      status: "ACTIVE",
      ...(source.followeeId ? { ownerId: source.followeeId } : {}),
      ...(source.communityId ? { communityId: source.communityId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      ownerId: true,
      title: true,
      author: true,
      genre: true,
      transactionType: true,
      communityId: true,
      createdAt: true,
    },
  });
  if (listings.length === 0) return { count: 0 };
  return tx.feedItem.createMany({
    data: listings.map((listing) => ({
      userId,
      listingId: listing.id,
      kind: "new_listing",
      createdAt: listing.createdAt,
      payload: {
        event: "listing.created",
        listingId: listing.id,
        ownerId: listing.ownerId,
        title: listing.title,
        author: listing.author,
        genre: listing.genre,
        transactionType: listing.transactionType,
        communityId: listing.communityId,
        reasons: [source.followeeId ? "followed_owner" : "community"],
      },
    })),
    skipDuplicates: true,
  });
}
