import { describe, expect, it } from "vitest";

import { canCommunityModeratorApplyAction } from "@/server/moderation/service";
import { shouldDecayUser } from "@/server/reputation/decay";

describe("moderation actions", () => {
  it("keeps transaction dispute decisions global-moderator only", () => {
    expect(canCommunityModeratorApplyAction("USER", "RESOLVE_DISPUTE")).toBe(false);
    expect(canCommunityModeratorApplyAction("USER", "REJECT_DISPUTE")).toBe(false);
    expect(canCommunityModeratorApplyAction("MODERATOR", "RESOLVE_DISPUTE")).toBe(true);
    expect(canCommunityModeratorApplyAction("ADMIN", "REJECT_DISPUTE")).toBe(true);
  });
});

describe("reputation time decay", () => {
  const now = new Date("2026-06-04T00:00:00Z");

  it("applies after 30 inactive days when the user has positive score", () => {
    expect(shouldDecayUser({
      status: "ACTIVE",
      reputationScore: 10,
      createdAt: new Date("2026-04-01T00:00:00Z"),
      lastReputationEventAt: new Date("2026-04-15T00:00:00Z"),
    }, now)).toBe(true);
  });

  it("does not decay suspended, zero-score, or recently active users", () => {
    expect(shouldDecayUser({
      status: "SUSPENDED",
      reputationScore: 10,
      createdAt: new Date("2026-04-01T00:00:00Z"),
      lastReputationEventAt: new Date("2026-04-15T00:00:00Z"),
    }, now)).toBe(false);
    expect(shouldDecayUser({
      status: "ACTIVE",
      reputationScore: 0,
      createdAt: new Date("2026-04-01T00:00:00Z"),
      lastReputationEventAt: null,
    }, now)).toBe(false);
    expect(shouldDecayUser({
      status: "ACTIVE",
      reputationScore: 10,
      createdAt: new Date("2026-05-20T00:00:00Z"),
      lastReputationEventAt: new Date("2026-05-25T00:00:00Z"),
    }, now)).toBe(false);
  });
});
