import type { Prisma } from "@prisma/client";
import { notificationTargets } from "../notifications/dispatcher";

type ListingCreatedInput = {
  listing: {
    id: string;
    ownerId: string;
    title: string;
    author: string;
    genre: string;
    transactionType: string;
    communityId: string | null;
  };
  followers: Array<{ followerId: string }>;
  communityMembers: Array<{ userId: string }>;
};

type FanoutRows = {
  feedItems: Prisma.FeedItemCreateManyInput[];
  notifications: Prisma.NotificationCreateManyInput[];
};

export async function emitListingCreated(
  tx: Prisma.TransactionClient,
  listing: ListingCreatedInput["listing"],
) {
  const [followers, communityMembers] = await Promise.all([
    tx.follow.findMany({
      where: { followeeId: listing.ownerId },
      select: { followerId: true },
    }),
    listing.communityId
      ? tx.communityMembership.findMany({
          where: { communityId: listing.communityId },
          select: { userId: true },
        })
      : Promise.resolve([]),
  ]);

  const rows = buildListingCreatedFanout({ listing, followers, communityMembers });
  if (rows.feedItems.length > 0) {
    await tx.feedItem.createMany({ data: rows.feedItems });
  }
  if (rows.notifications.length > 0) {
    await tx.notification.createMany({ data: rows.notifications });
  }
}

export function buildListingCreatedFanout({
  listing,
  followers,
  communityMembers,
}: ListingCreatedInput): FanoutRows {
  const payload = {
    event: "listing.created",
    listingId: listing.id,
    ownerId: listing.ownerId,
    title: listing.title,
    author: listing.author,
    genre: listing.genre,
    transactionType: listing.transactionType,
    communityId: listing.communityId,
  };

  const feedRecipients = new Map<string, string[]>();
  for (const { followerId } of followers) {
    if (followerId !== listing.ownerId) addReason(feedRecipients, followerId, "followed_owner");
  }
  for (const { userId } of communityMembers) {
    if (userId !== listing.ownerId) addReason(feedRecipients, userId, "community");
  }

  const feedItems: Prisma.FeedItemCreateManyInput[] = Array.from(feedRecipients.entries())
    .map(([userId, reasons]) => ({
      userId,
      listingId: listing.id,
      kind: "new_listing",
      payload: { ...payload, reasons },
    }));

  const notifications: Prisma.NotificationCreateManyInput[] = notificationTargets({
    kind: "listing.created",
    actorId: listing.ownerId,
    listingId: listing.id,
    title: listing.title,
    followerIds: followers.map(({ followerId }) => followerId),
    communityMemberIds: communityMembers.map(({ userId }) => userId),
  });

  return { feedItems, notifications };
}

function addReason(recipients: Map<string, string[]>, userId: string, reason: string) {
  const reasons = recipients.get(userId) ?? [];
  if (!reasons.includes(reason)) reasons.push(reason);
  recipients.set(userId, reasons);
}
