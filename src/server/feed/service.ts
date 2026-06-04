import { prisma } from "../lib/prisma";

export async function listFeed(userId: string, cursor?: string, pageSize = 20) {
  const size = Math.min(Math.max(pageSize, 1), 50);
  const rows = await prisma.feedItem.findMany({
    where: { userId, listing: { status: "ACTIVE" } },
    include: {
      listing: {
        include: {
          photos: { take: 1, orderBy: { position: "asc" } },
          owner: { select: { id: true, displayName: true, reputationScore: true, reputationTier: true } },
          community: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: size + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
  });
  return {
    items: rows.slice(0, size),
    nextCursor: rows.length > size ? rows[size].id : null,
  };
}

export async function feedAfter(userId: string, after: Date) {
  return prisma.feedItem.findMany({
    where: { userId, createdAt: { gt: after }, listing: { status: "ACTIVE" } },
    include: {
      listing: {
        include: {
          photos: { take: 1, orderBy: { position: "asc" } },
          owner: { select: { id: true, displayName: true, reputationScore: true, reputationTier: true } },
          community: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
}

export async function markFeedSeen(userId: string, ids: string[]) {
  return prisma.feedItem.updateMany({ where: { userId, id: { in: ids } }, data: { seen: true } });
}

export async function syncFeedForUser(userId: string) {
  const [following, memberships] = await Promise.all([
    prisma.follow.findMany({ where: { followerId: userId }, select: { followeeId: true } }),
    prisma.communityMembership.findMany({ where: { userId }, select: { communityId: true } }),
  ]);
  const listings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        ...(following.length ? [{ ownerId: { in: following.map((row) => row.followeeId) } }] : []),
        ...(memberships.length ? [{ communityId: { in: memberships.map((row) => row.communityId) } }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, ownerId: true, communityId: true, title: true, author: true, genre: true, transactionType: true, createdAt: true },
  });
  if (listings.length === 0) return { count: 0 };
  return prisma.feedItem.createMany({
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
        reasons: [
          ...(following.some((row) => row.followeeId === listing.ownerId) ? ["followed_owner"] : []),
          ...(memberships.some((row) => row.communityId === listing.communityId) ? ["community"] : []),
        ],
      },
    })),
    skipDuplicates: true,
  });
}
