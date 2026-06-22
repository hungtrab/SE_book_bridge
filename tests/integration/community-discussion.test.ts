// Integration tests for the comment/post deletion paths in
// src/server/communities/service.ts, against an in-memory fake Prisma client
// (see tests/helpers/fake-prisma.ts). These specifically regression-test two
// bugs fixed in this module:
//   1. deleteComment only decremented commentCount by 1 even though deleting
//      a parent comment cascades all its replies in the real schema
//      (`parent` relation has `onDelete: Cascade`).
//   2. communityPoints awarded for posting/commenting/reacting were never
//      reverted on delete, letting a user farm points via create+delete spam.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakePrisma } from "../helpers/fake-prisma";

const dispatchNotifications = vi.fn();
let fakePrisma: ReturnType<typeof createFakePrisma>;

vi.mock("@/server/lib/prisma", () => ({ get prisma() { return fakePrisma; } }));
vi.mock("@/server/notifications/dispatcher", () => ({ dispatchNotifications: (...args: unknown[]) => dispatchNotifications(...args) }));
vi.mock("@/server/feed/fanout", () => ({ fanoutExistingListingsToUser: vi.fn() }));

function actor(overrides: Record<string, unknown> = {}) {
  return { id: "actor", role: "USER", ...overrides } as any;
}

function baseSeed() {
  return {
    communities: [{ id: "community-1", ownerId: "owner", name: "Book Club", isPrivate: false }],
    communityMemberships: [
      { userId: "owner", communityId: "community-1", role: "MODERATOR", communityPoints: 0 },
      { userId: "alice", communityId: "community-1", role: "MEMBER", communityPoints: 0 },
      { userId: "bob", communityId: "community-1", role: "MEMBER", communityPoints: 0 },
      { userId: "carol", communityId: "community-1", role: "MEMBER", communityPoints: 0 },
    ],
  };
}

describe("community discussion — deleteComment", () => {
  beforeEach(() => { dispatchNotifications.mockReset(); });

  it("decrements commentCount by exactly 1 for a leaf reply (no cascade)", async () => {
    fakePrisma = createFakePrisma({
      ...baseSeed(),
      communityPosts: [{ id: "post-1", communityId: "community-1", authorId: "owner", title: "t", body: "b", commentCount: 2, kind: "MEMBER" }],
      communityPostComments: [
        { id: "top-1", postId: "post-1", authorId: "alice", parentId: null, body: "top" },
        { id: "reply-1", postId: "post-1", authorId: "bob", parentId: "top-1", body: "reply" },
      ],
    });
    fakePrisma.communityMembership.rows.find((m: any) => m.userId === "bob").communityPoints = 3;
    const { deleteComment } = await import("@/server/communities/service");
    await deleteComment(actor({ id: "bob" }), "community-1", "post-1", "reply-1");
    const post = await fakePrisma.communityPost.findUnique({ where: { id: "post-1" } });
    expect(post.commentCount).toBe(1);
    expect(fakePrisma.communityPostComment.rows).toHaveLength(1);
    const bobMembership = fakePrisma.communityMembership.rows.find((m: any) => m.userId === "bob");
    expect(bobMembership.communityPoints).toBe(0); // +3 on create, -3 on delete
  });

  it("BUG FIX: deleting a parent comment with 2 replies decrements commentCount by 3, not 1", async () => {
    fakePrisma = createFakePrisma({
      ...baseSeed(),
      communityPosts: [{ id: "post-1", communityId: "community-1", authorId: "owner", title: "t", body: "b", commentCount: 3, kind: "MEMBER" }],
      communityPostComments: [
        { id: "top-1", postId: "post-1", authorId: "alice", parentId: null, body: "top" },
        { id: "reply-1", postId: "post-1", authorId: "bob", parentId: "top-1", body: "r1" },
        { id: "reply-2", postId: "post-1", authorId: "carol", parentId: "top-1", body: "r2" },
      ],
    });
    for (const id of ["alice", "bob", "carol"]) {
      fakePrisma.communityMembership.rows.find((m: any) => m.userId === id).communityPoints = 3;
    }
    const { deleteComment } = await import("@/server/communities/service");
    await deleteComment(actor({ id: "alice" }), "community-1", "post-1", "top-1");

    const post = await fakePrisma.communityPost.findUnique({ where: { id: "post-1" } });
    expect(post.commentCount).toBe(0); // 3 - (1 parent + 2 replies) = 0, not 2
    expect(fakePrisma.communityPostComment.rows).toHaveLength(0); // DB-level cascade simulated by the service itself

    // BUG FIX 2: every cascaded author's community points are reverted, not just the parent's.
    for (const id of ["alice", "bob", "carol"]) {
      const membership = fakePrisma.communityMembership.rows.find((m: any) => m.userId === id);
      expect(membership.communityPoints).toBe(0);
    }
  });

  it("never drives communityPoints negative even if the ledger is already below the revert amount", async () => {
    fakePrisma = createFakePrisma({
      ...baseSeed(),
      communityPosts: [{ id: "post-1", communityId: "community-1", authorId: "owner", title: "t", body: "b", commentCount: 1, kind: "MEMBER" }],
      communityPostComments: [{ id: "top-1", postId: "post-1", authorId: "alice", parentId: null, body: "top" }],
    });
    fakePrisma.communityMembership.rows.find((m: any) => m.userId === "alice").communityPoints = 1; // less than the 3 to revert
    const { deleteComment } = await import("@/server/communities/service");
    await deleteComment(actor({ id: "alice" }), "community-1", "post-1", "top-1");
    const membership = fakePrisma.communityMembership.rows.find((m: any) => m.userId === "alice");
    expect(membership.communityPoints).toBe(1); // guard skips the decrement rather than going negative
  });

  it("lets a community moderator delete someone else's comment, but blocks a regular member", async () => {
    fakePrisma = createFakePrisma({
      ...baseSeed(),
      communityPosts: [{ id: "post-1", communityId: "community-1", authorId: "owner", title: "t", body: "b", commentCount: 1, kind: "MEMBER" }],
      communityPostComments: [{ id: "top-1", postId: "post-1", authorId: "alice", parentId: null, body: "top" }],
    });
    const { deleteComment } = await import("@/server/communities/service");
    await expect(deleteComment(actor({ id: "bob" }), "community-1", "post-1", "top-1")).rejects.toThrow("Cannot delete this comment");
    await deleteComment(actor({ id: "owner" }), "community-1", "post-1", "top-1"); // owner acts as mod
    expect(fakePrisma.communityPostComment.rows).toHaveLength(0);
  });
});

describe("community discussion — deleteCommunityPost", () => {
  beforeEach(() => { dispatchNotifications.mockReset(); });

  it("BUG FIX: reverts the post author's points and every commenter/liker's points on cascade delete", async () => {
    fakePrisma = createFakePrisma({
      ...baseSeed(),
      communityPosts: [{ id: "post-1", communityId: "community-1", authorId: "alice", title: "t", body: "b", commentCount: 1, likeCount: 1, kind: "MEMBER" }],
      communityPostComments: [{ id: "c1", postId: "post-1", authorId: "bob", parentId: null, body: "nice" }],
      communityPostLikes: [{ userId: "carol", postId: "post-1", reaction: "LIKE" }],
    });
    fakePrisma.communityMembership.rows.find((m: any) => m.userId === "alice").communityPoints = 5; // +5 for posting
    fakePrisma.communityMembership.rows.find((m: any) => m.userId === "bob").communityPoints = 3; // +3 for commenting
    fakePrisma.communityMembership.rows.find((m: any) => m.userId === "carol").communityPoints = 2; // +2 for reacting

    const { deleteCommunityPost } = await import("@/server/communities/service");
    await deleteCommunityPost(actor({ id: "alice" }), "community-1", "post-1");

    expect(fakePrisma.communityPost.rows).toHaveLength(0);
    expect(fakePrisma.communityMembership.rows.find((m: any) => m.userId === "alice").communityPoints).toBe(0);
    expect(fakePrisma.communityMembership.rows.find((m: any) => m.userId === "bob").communityPoints).toBe(0);
    expect(fakePrisma.communityMembership.rows.find((m: any) => m.userId === "carol").communityPoints).toBe(0);
  });

  it("REGRESSION: create-then-delete round trip cannot be used to farm community points", async () => {
    fakePrisma = createFakePrisma(baseSeed());
    const { createCommunityPost, createComment, deleteCommunityPost } = await import("@/server/communities/service");

    const post = await createCommunityPost(actor({ id: "alice" }), "community-1", { title: "Free books!", body: "Come get some, this is a long enough body.", isPinned: false });
    await createComment(actor({ id: "bob" }), "community-1", post.id, { body: "awesome, thanks for sharing" });

    expect(fakePrisma.communityMembership.rows.find((m: any) => m.userId === "alice").communityPoints).toBe(5);
    expect(fakePrisma.communityMembership.rows.find((m: any) => m.userId === "bob").communityPoints).toBe(3);

    await deleteCommunityPost(actor({ id: "alice" }), "community-1", post.id);

    // Before the fix, both users would have kept their farmed points indefinitely.
    expect(fakePrisma.communityMembership.rows.find((m: any) => m.userId === "alice").communityPoints).toBe(0);
    expect(fakePrisma.communityMembership.rows.find((m: any) => m.userId === "bob").communityPoints).toBe(0);
  });
});
