import type { NotificationKind, Prisma } from "@prisma/client";

import type { DomainEvent } from "../lib/events";

export type NotificationTarget = {
  userId: string;
  kind: NotificationKind;
  payload: Prisma.InputJsonValue;
};

export function notificationTargets(event: DomainEvent): NotificationTarget[] {
  switch (event.kind) {
    case "listing.created":
      return uniqueTargets([
        ...event.followerIds.map((userId) => ({
          userId,
          kind: "NEW_LISTING_FROM_FOLLOWED" as const,
          payload: event,
        })),
        ...event.communityMemberIds.map((userId) => ({
          userId,
          kind: "COMMUNITY_ANNOUNCEMENT" as const,
          payload: event,
        })),
      ], event.actorId);
    case "transaction.requested":
      return event.ownerId === event.actorId
        ? []
        : [{
            userId: event.ownerId,
            kind: "TRANSACTION_STATUS_CHANGED",
            payload: event,
          }];
    case "transaction.status_changed":
      return uniqueTargets(event.recipientIds.map((userId) => ({
        userId,
        kind: "TRANSACTION_STATUS_CHANGED" as const,
        payload: event,
      })), event.actorId);
    case "message.created":
      return event.recipientId === event.actorId
        ? []
        : [{ userId: event.recipientId, kind: "NEW_MESSAGE", payload: event }];
    case "community.announcement":
      return uniqueTargets(event.recipientIds.map((userId) => ({
        userId,
        kind: "COMMUNITY_ANNOUNCEMENT" as const,
        payload: event,
      })), event.actorId);
    case "reputation.tier_changed":
      return [{ userId: event.userId, kind: "REPUTATION_TIER_CHANGED", payload: event }];
    case "moderation.action":
      return event.userId === event.actorId
        ? []
        : [{ userId: event.userId, kind: "MODERATION_ACTION", payload: event }];
    case "community.post_created":
      return uniqueTargets(event.recipientIds.map((userId) => ({
        userId,
        kind: "COMMUNITY_POST_CREATED" as const,
        payload: event,
      })), event.actorId);
    case "community.post_liked":
      return event.authorId === event.actorId
        ? []
        : [{ userId: event.authorId, kind: "COMMUNITY_POST_LIKED" as const, payload: event }];
    case "community.post_commented":
      return event.authorId === event.actorId
        ? []
        : [{ userId: event.authorId, kind: "COMMUNITY_POST_COMMENTED" as const, payload: event }];
  }
}

export async function dispatchNotifications(tx: Prisma.TransactionClient, event: DomainEvent) {
  const targets = notificationTargets(event);
  if (targets.length === 0) return { count: 0 };
  const result = await tx.notification.createMany({ data: targets });
  return { count: result.count };
}

function uniqueTargets(targets: NotificationTarget[], actorId: string): NotificationTarget[] {
  const seen = new Set<string>();
  return targets.filter((target) => {
    const key = `${target.userId}:${target.kind}`;
    if (target.userId === actorId || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
