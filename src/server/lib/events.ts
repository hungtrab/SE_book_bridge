export type DomainEvent =
  | {
      kind: "listing.created";
      actorId: string;
      listingId: string;
      title: string;
      followerIds: string[];
      communityMemberIds: string[];
    }
  | {
      kind: "transaction.requested";
      actorId: string;
      transactionId: string;
      listingId: string;
      title: string;
      ownerId: string;
      requesterId: string;
    }
  | {
      kind: "transaction.status_changed";
      actorId: string;
      transactionId: string;
      recipientIds: string[];
      status: string;
    }
  | {
      kind: "message.created";
      actorId: string;
      conversationId: string;
      messageId: string;
      recipientId: string;
    }
  | {
      kind: "community.announcement";
      actorId: string;
      communityId: string;
      recipientIds: string[];
      title: string;
    }
  | {
      kind: "reputation.tier_changed";
      actorId: string;
      userId: string;
      tier: string;
    }
  | {
      kind: "moderation.action";
      actorId: string;
      userId: string;
      reportId: string;
      action: string;
    };
