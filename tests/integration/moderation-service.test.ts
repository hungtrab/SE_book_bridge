// Integration tests for src/server/moderation/service.ts against an in-memory
// fake Prisma client (see tests/helpers/fake-prisma.ts). `addReputationEvent`
// (owned by the same role) runs for real against the fake store; the
// transaction state machine (#4's `applyTransactionActionInTx`) and the
// notification dispatcher (#4's domain) are mocked — we only verify they are
// invoked correctly, not their internals.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakePrisma } from "../helpers/fake-prisma";

const dispatchNotifications = vi.fn();
const applyTransactionActionInTx = vi.fn();
let fakePrisma: ReturnType<typeof createFakePrisma>;

vi.mock("@/server/lib/prisma", () => ({ get prisma() { return fakePrisma; } }));
vi.mock("@/server/notifications/dispatcher", () => ({ dispatchNotifications: (...args: unknown[]) => dispatchNotifications(...args) }));
vi.mock("@/server/transactions/service", () => ({ applyTransactionActionInTx: (...args: unknown[]) => applyTransactionActionInTx(...args) }));

function actor(overrides: Record<string, unknown> = {}) {
  return { id: "actor", role: "USER", ...overrides } as any;
}

describe("moderation service — fileReport", () => {
  beforeEach(() => {
    dispatchNotifications.mockReset();
    fakePrisma = createFakePrisma({
      users: [{ id: "victim", email: "victim@x.com" }, { id: "filer", email: "filer@x.com" }],
    });
  });

  it("rejects a ticket a user files about themself", async () => {
    const { fileReport } = await import("@/server/moderation/service");
    await expect(fileReport(actor({ id: "victim" }), {
      targetType: "USER", targetId: "victim", reason: "spam",
    })).rejects.toThrow("You cannot create a ticket about yourself");
  });

  it("blocks a 6th ticket within 24h (rate limit)", async () => {
    const { fileReport } = await import("@/server/moderation/service");
    for (let i = 0; i < 5; i += 1) {
      fakePrisma.report.rows.push({
        id: `old-${i}`, filerId: "filer", status: "RESOLVED", targetType: "USER", targetUserId: "victim",
        createdAt: new Date(),
      });
    }
    await expect(fileReport(actor({ id: "filer" }), {
      targetType: "USER", targetId: "victim", reason: "spam again",
    })).rejects.toThrow("too many tickets");
  });

  it("blocks a duplicate pending ticket against the same target", async () => {
    const { fileReport } = await import("@/server/moderation/service");
    fakePrisma.report.rows.push({
      id: "existing", filerId: "filer", status: "PENDING", targetType: "USER", targetUserId: "victim",
      createdAt: new Date(),
    });
    await expect(fileReport(actor({ id: "filer" }), {
      targetType: "USER", targetId: "victim", reason: "spam",
    })).rejects.toThrow("already have a pending ticket");
  });

  it("lets either party of a transaction report the other, resolving targetUserId to the counterparty", async () => {
    fakePrisma.transaction.rows.push({ id: "t1", ownerId: "owner", requesterId: "filer" });
    const { fileReport } = await import("@/server/moderation/service");
    const report = await fileReport(actor({ id: "filer" }), {
      targetType: "TRANSACTION", targetId: "t1", reason: "never shipped",
    });
    expect(report.targetUserId).toBe("owner");
    expect(report.targetTransactionId).toBe("t1");
  });

  it("forbids filing a transaction report by someone outside the deal", async () => {
    fakePrisma.transaction.rows.push({ id: "t1", ownerId: "owner", requesterId: "requester" });
    const { fileReport } = await import("@/server/moderation/service");
    await expect(fileReport(actor({ id: "outsider" }), {
      targetType: "TRANSACTION", targetId: "t1", reason: "nosy",
    })).rejects.toThrow("You cannot create a ticket for this transaction");
  });

  it("blocks reporting your own message, but lets the recipient report it", async () => {
    fakePrisma.conversations.push({ id: "c1", userAId: "sender", userBId: "recipient" });
    fakePrisma.message.rows.push({ id: "m1", senderId: "sender", conversationId: "c1" });
    const { fileReport } = await import("@/server/moderation/service");
    await expect(fileReport(actor({ id: "sender" }), {
      targetType: "MESSAGE", targetId: "m1", reason: "self",
    })).rejects.toThrow("about your own message");
    const report = await fileReport(actor({ id: "recipient" }), {
      targetType: "MESSAGE", targetId: "m1", reason: "harassment",
    });
    expect(report.targetUserId).toBe("sender");
  });
});

describe("moderation service — applyModerationAction", () => {
  beforeEach(() => {
    dispatchNotifications.mockReset();
    applyTransactionActionInTx.mockReset();
    fakePrisma = createFakePrisma({
      users: [
        { id: "target", reputationScore: 50, reputationTier: "trusted", lastReputationEventAt: null },
        { id: "filer" },
      ],
      reports: [{ id: "r1", filerId: "filer", status: "PENDING", targetType: "USER", targetUserId: "target" }],
    });
  });

  it("WARN applies the REPORT_UPHELD reputation penalty and resolves the ticket", async () => {
    const { applyModerationAction } = await import("@/server/moderation/service");
    await applyModerationAction(actor({ id: "mod", role: "MODERATOR" }), "r1", { action: "WARN", notes: "be nice" });
    const target = await fakePrisma.user.findUnique({ where: { id: "target" } });
    expect(target.reputationScore).toBe(35); // 50 - 15
    const report = await fakePrisma.report.findUnique({ where: { id: "r1" } });
    expect(report.status).toBe("RESOLVED");
    expect(fakePrisma.moderationAction.rows).toHaveLength(1);
  });

  it("REJECT_REPORT does not penalise the target and marks the ticket REJECTED", async () => {
    const { applyModerationAction } = await import("@/server/moderation/service");
    await applyModerationAction(actor({ id: "mod", role: "MODERATOR" }), "r1", { action: "REJECT_REPORT", notes: "no evidence" });
    const target = await fakePrisma.user.findUnique({ where: { id: "target" } });
    expect(target.reputationScore).toBe(50); // unchanged
    const report = await fakePrisma.report.findUnique({ where: { id: "r1" } });
    expect(report.status).toBe("REJECTED");
  });

  it("rejects an action on an already-resolved ticket (no double-moderation)", async () => {
    fakePrisma.report.rows[0].status = "RESOLVED";
    const { applyModerationAction } = await import("@/server/moderation/service");
    await expect(applyModerationAction(actor({ id: "mod", role: "MODERATOR" }), "r1", { action: "WARN", notes: "late" }))
      .rejects.toThrow("already resolved");
  });

  it("a plain user with no moderator access anywhere is rejected outright", async () => {
    const { applyModerationAction } = await import("@/server/moderation/service");
    await expect(applyModerationAction(actor({ id: "rando", role: "USER" }), "r1", { action: "WARN", notes: "no access" }))
      .rejects.toThrow("Moderator access required");
  });

  it("scopes a community moderator to listing reports inside their own community, and restricts their actions", async () => {
    fakePrisma = createFakePrisma({
      users: [{ id: "owner" }],
      listings: [{ id: "listing-1", ownerId: "owner", communityId: "community-1", status: "ACTIVE" }],
      reports: [{ id: "r-listing", filerId: "filer", status: "PENDING", targetType: "LISTING", targetListingId: "listing-1" }],
      communityMemberships: [{ userId: "communitymod", communityId: "community-1", role: "MODERATOR" }],
    });
    const { applyModerationAction } = await import("@/server/moderation/service");

    // Allowed: community moderators can remove a listing in their own community's queue.
    await applyModerationAction(actor({ id: "communitymod", role: "USER" }), "r-listing", { action: "REMOVE_LISTING", notes: "broke rules" });
    const listing = await fakePrisma.listing.findUnique({ where: { id: "listing-1" } });
    expect(listing.status).toBe("REMOVED");
  });

  it("blocks a community moderator from SUSPEND_USER even on a report they can see", async () => {
    fakePrisma = createFakePrisma({
      users: [{ id: "owner" }],
      listings: [{ id: "listing-1", ownerId: "owner", communityId: "community-1", status: "ACTIVE" }],
      reports: [{ id: "r-listing", filerId: "filer", status: "PENDING", targetType: "LISTING", targetListingId: "listing-1", targetUserId: "owner" }],
      communityMemberships: [{ userId: "communitymod", communityId: "community-1", role: "MODERATOR" }],
    });
    const { applyModerationAction } = await import("@/server/moderation/service");
    await expect(applyModerationAction(actor({ id: "communitymod", role: "USER" }), "r-listing", { action: "SUSPEND_USER", notes: "ban them" }))
      .rejects.toThrow("Community moderators cannot apply global account actions");
  });

  it("rejects resolving a dispute whose transaction is no longer DISPUTED (race with #4's flow)", async () => {
    fakePrisma = createFakePrisma({
      users: [{ id: "owner" }, { id: "requester" }],
      transactions: [{ id: "t1", ownerId: "owner", requesterId: "requester", status: "CANCELLED" }],
      reports: [{ id: "r-disp", filerId: "owner", status: "PENDING", targetType: "TRANSACTION", targetTransactionId: "t1", targetUserId: "requester" }],
    });
    const { applyModerationAction } = await import("@/server/moderation/service");
    await expect(applyModerationAction(actor({ id: "mod", role: "MODERATOR" }), "r-disp", { action: "RESOLVE_DISPUTE", notes: "favour owner" }))
      .rejects.toThrow("no longer disputed");
    expect(applyTransactionActionInTx).not.toHaveBeenCalled();
  });

  it("resolves a live dispute by delegating to the transaction state machine", async () => {
    fakePrisma = createFakePrisma({
      users: [{ id: "owner" }, { id: "requester" }],
      transactions: [{ id: "t1", ownerId: "owner", requesterId: "requester", status: "DISPUTED" }],
      reports: [{ id: "r-disp", filerId: "owner", status: "PENDING", targetType: "TRANSACTION", targetTransactionId: "t1", targetUserId: "requester" }],
    });
    const { applyModerationAction } = await import("@/server/moderation/service");
    await applyModerationAction(actor({ id: "mod", role: "MODERATOR" }), "r-disp", { action: "RESOLVE_DISPUTE", notes: "favour owner" });
    expect(applyTransactionActionInTx).toHaveBeenCalledTimes(1);
    expect(applyTransactionActionInTx.mock.calls[0][2]).toBe("t1");
    expect(applyTransactionActionInTx.mock.calls[0][3]).toMatchObject({ kind: "moderate-resolve" });
  });

  it("REMOVE_LISTING on a report that doesn't target a listing is rejected", async () => {
    const { applyModerationAction } = await import("@/server/moderation/service");
    await expect(applyModerationAction(actor({ id: "mod", role: "MODERATOR" }), "r1", { action: "REMOVE_LISTING", notes: "wrong target" }))
      .rejects.toThrow("does not target a listing");
  });

  it("RESTORE flips a removed listing back to ACTIVE", async () => {
    fakePrisma = createFakePrisma({
      users: [{ id: "owner" }],
      listings: [{ id: "listing-1", ownerId: "owner", communityId: "community-1", status: "REMOVED" }],
      reports: [{ id: "r-listing", filerId: "filer", status: "PENDING", targetType: "LISTING", targetListingId: "listing-1", targetUserId: "owner" }],
    });
    const { applyModerationAction } = await import("@/server/moderation/service");
    await applyModerationAction(actor({ id: "mod", role: "MODERATOR" }), "r-listing", { action: "RESTORE", notes: "appeal granted" });
    const listing = await fakePrisma.listing.findUnique({ where: { id: "listing-1" } });
    expect(listing.status).toBe("ACTIVE");
  });
});
