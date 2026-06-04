import { describe, expect, it } from "vitest";

import { csvCell } from "@/server/admin/exports";
import {
  canJoinCommunity,
  MAX_COMMUNITIES_PER_USER,
} from "@/server/communities/service";
import { notificationTargets } from "@/server/notifications/dispatcher";
import { renderDigest } from "@/server/notifications/email";

describe("communities", () => {
  it("enforces max 20 memberships", () => {
    expect(canJoinCommunity(MAX_COMMUNITIES_PER_USER - 1)).toBe(true);
    expect(canJoinCommunity(MAX_COMMUNITIES_PER_USER)).toBe(false);
  });
});

describe("notification dispatcher", () => {
  it("deduplicates targets by user and kind and excludes actor", () => {
    const targets = notificationTargets({
      kind: "listing.created",
      actorId: "owner",
      listingId: "listing",
      title: "Book",
      followerIds: ["owner", "a", "b", "b"],
      communityMemberIds: ["owner", "b", "c"],
    });
    expect(targets.map((target) => `${target.userId}:${target.kind}`).sort()).toEqual([
      "a:NEW_LISTING_FROM_FOLLOWED",
      "b:COMMUNITY_ANNOUNCEMENT",
      "b:NEW_LISTING_FROM_FOLLOWED",
      "c:COMMUNITY_ANNOUNCEMENT",
    ]);
  });

  it("notifies a moderation target but not the acting moderator", () => {
    expect(notificationTargets({
      kind: "moderation.action",
      actorId: "moderator",
      userId: "target",
      reportId: "report",
      action: "WARN",
    })).toHaveLength(1);
    expect(notificationTargets({
      kind: "moderation.action",
      actorId: "same-user",
      userId: "same-user",
      reportId: "report",
      action: "WARN",
    })).toEqual([]);
  });

  it("notifies listing owner when a requester opens a transaction", () => {
    expect(notificationTargets({
      kind: "transaction.requested",
      actorId: "requester",
      transactionId: "txn",
      listingId: "listing",
      title: "Sapiens",
      ownerId: "owner",
      requesterId: "requester",
    })).toEqual([{
      userId: "owner",
      kind: "TRANSACTION_STATUS_CHANGED",
      payload: {
        kind: "transaction.requested",
        actorId: "requester",
        transactionId: "txn",
        listingId: "listing",
        title: "Sapiens",
        ownerId: "owner",
        requesterId: "requester",
      },
    }]);
  });
});

describe("grant export", () => {
  it("neutralizes spreadsheet formulas and quotes CSV", () => {
    expect(csvCell("=SUM(A1:A2)")).toBe("\"'=SUM(A1:A2)\"");
    expect(csvCell("hello, world")).toBe("\"hello, world\"");
  });
});

describe("notification digest", () => {
  it("renders notification content", () => {
    const digest = renderDigest([{
      kind: "NEW_MESSAGE",
      payload: { conversationId: "c1" },
      createdAt: new Date("2026-06-04T00:00:00Z"),
    }]);
    expect(digest).toContain("NEW_MESSAGE");
    expect(digest).toContain("conversationId");
  });
});
