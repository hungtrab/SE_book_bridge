// Integration tests for src/server/moderation/queue.ts — the access-control
// layer that decides who sees which reports (REQ-MOD-002: "moderator queue
// only shows scope-relevant reports").
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakePrisma } from "../helpers/fake-prisma";

let fakePrisma: ReturnType<typeof createFakePrisma>;
vi.mock("@/server/lib/prisma", () => ({ get prisma() { return fakePrisma; } }));

function actor(overrides: Record<string, unknown> = {}) {
  return { id: "actor", role: "USER", ...overrides } as any;
}

function seedTwoCommunities() {
  return {
    listings: [
      { id: "listing-a", ownerId: "owner-a", communityId: "community-a", status: "ACTIVE" },
      { id: "listing-b", ownerId: "owner-b", communityId: "community-b", status: "ACTIVE" },
    ],
    reports: [
      { id: "report-a", filerId: "filer", status: "PENDING", targetType: "LISTING", targetListingId: "listing-a", createdAt: new Date("2026-01-01") },
      { id: "report-b", filerId: "filer", status: "PENDING", targetType: "LISTING", targetListingId: "listing-b", createdAt: new Date("2026-01-02") },
    ],
    communityMemberships: [
      { userId: "mod-a", communityId: "community-a", role: "MODERATOR" },
      { userId: "mod-b", communityId: "community-b", role: "MODERATOR" },
      { userId: "member-a", communityId: "community-a", role: "MEMBER" },
    ],
  };
}

describe("moderation queue — listModerationQueue", () => {
  beforeEach(() => { fakePrisma = createFakePrisma(seedTwoCommunities()); });

  it("ADMIN and global MODERATOR see every pending report across all communities", async () => {
    const { listModerationQueue } = await import("@/server/moderation/queue");
    const adminView = await listModerationQueue(actor({ role: "ADMIN" }));
    expect(adminView.map((r: any) => r.id).sort()).toEqual(["report-a", "report-b"]);
    const modView = await listModerationQueue(actor({ role: "MODERATOR" }));
    expect(modView).toHaveLength(2);
  });

  it("a community moderator only sees reports scoped to their own community's listings", async () => {
    const { listModerationQueue } = await import("@/server/moderation/queue");
    const view = await listModerationQueue(actor({ id: "mod-a", role: "USER" }));
    expect(view.map((r: any) => r.id)).toEqual(["report-a"]);
  });

  it("a plain member with no MODERATOR role anywhere is rejected", async () => {
    const { listModerationQueue } = await import("@/server/moderation/queue");
    await expect(listModerationQueue(actor({ id: "member-a", role: "USER" }))).rejects.toThrow("Moderator access required");
  });
});

describe("moderation queue — hasModerationAccess / canModerateReport", () => {
  beforeEach(() => { fakePrisma = createFakePrisma(seedTwoCommunities()); });

  it("hasModerationAccess is true for ADMIN, global MODERATOR, and any community moderator", async () => {
    const { hasModerationAccess } = await import("@/server/moderation/queue");
    expect(await hasModerationAccess(actor({ role: "ADMIN" }))).toBe(true);
    expect(await hasModerationAccess(actor({ role: "MODERATOR" }))).toBe(true);
    expect(await hasModerationAccess(actor({ id: "mod-a", role: "USER" }))).toBe(true);
    expect(await hasModerationAccess(actor({ id: "member-a", role: "USER" }))).toBe(false);
  });

  it("canModerateReport scopes a community moderator strictly to their own community — not a sibling community's report", async () => {
    const { canModerateReport } = await import("@/server/moderation/queue");
    expect(await canModerateReport(actor({ id: "mod-a", role: "USER" }), "report-a")).toBe(true);
    expect(await canModerateReport(actor({ id: "mod-a", role: "USER" }), "report-b")).toBe(false);
    expect(await canModerateReport(actor({ id: "mod-b", role: "USER" }), "report-b")).toBe(true);
  });
});
