import { describe, expect, it } from "vitest";

import {
  deltaForRating,
  ReputationWeights,
  tierForScore,
  tierLabel,
} from "@/server/reputation/scoring";

import {
  findCollusionGroups,
  findLowDiversityUsers,
  findReciprocalOnlyPairs,
  type CompletedTxn,
} from "@/server/reputation/anti-gaming";
import { canCommunityModeratorApplyAction } from "@/server/moderation/service";
import { shouldDecayUser } from "@/server/reputation/decay";

// ---------------------------------------------------------------------------
// Reputation scoring — tier thresholds
// ---------------------------------------------------------------------------
describe("reputation scoring — tier thresholds", () => {
  it.each([
    [0,   "new"],
    [19,  "new"],       // highest "new" score
    [20,  "active"],    // first "active" score
    [49,  "active"],
    [50,  "trusted"],   // first "trusted" score
    [79,  "trusted"],
    [80,  "champion"],  // first "champion" score
    [100, "champion"],
    [-5,  "new"],       // negative clamps to 0 → "new"
    [200, "champion"],  // over 100 clamps to 100 → "champion"
  ])("score %d → tier '%s'", (score, expected) => {
    expect(tierForScore(score)).toBe(expected);
  });

  it("tier labels map correctly for all 4 tiers", () => {
    expect(tierLabel("new")).toBe("New Member");
    expect(tierLabel("active")).toBe("Active Sharer");
    expect(tierLabel("trusted")).toBe("Trusted Contributor");
    expect(tierLabel("champion")).toBe("Community Champion");
  });
});

// ---------------------------------------------------------------------------
// Reputation scoring — weights & deltas
// ---------------------------------------------------------------------------
describe("reputation scoring — weights and rating deltas", () => {
  it("3-star rating gives exactly 0 delta (neutral)", () => {
    expect(deltaForRating(3)).toBe(0);
  });

  it("rating deltas are: 5★=+5, 4★=+3, 3★=0, 2★=-3, 1★=-5", () => {
    expect(deltaForRating(5)).toBe(5);
    expect(deltaForRating(4)).toBe(3);
    expect(deltaForRating(3)).toBe(0);
    expect(deltaForRating(2)).toBe(-3);
    expect(deltaForRating(1)).toBe(-5);
  });

  it("rating deltas decrease monotonically with stars", () => {
    expect(deltaForRating(5)).toBeGreaterThan(deltaForRating(4));
    expect(deltaForRating(4)).toBeGreaterThan(deltaForRating(3));
    expect(deltaForRating(3)).toBeGreaterThan(deltaForRating(2));
    expect(deltaForRating(2)).toBeGreaterThan(deltaForRating(1));
  });

  it("TRANSACTION_COMPLETED (+10) outweighs best rating (+5)", () => {
    expect(ReputationWeights.TRANSACTION_COMPLETED).toBeGreaterThan(ReputationWeights.RATING_FIVE_STAR);
  });

  it("REPORT_UPHELD penalty (-15) is larger in magnitude than any single rating gain", () => {
    expect(Math.abs(ReputationWeights.REPORT_UPHELD)).toBeGreaterThan(ReputationWeights.RATING_FIVE_STAR);
    expect(Math.abs(ReputationWeights.REPORT_UPHELD)).toBeGreaterThan(ReputationWeights.TRANSACTION_COMPLETED);
  });
});

// ---------------------------------------------------------------------------
// Anti-gaming heuristics
// ---------------------------------------------------------------------------
describe("anti-gaming — reciprocal pairs", () => {
  const txn = (id: string, owner: string, req: string): CompletedTxn => ({
    transactionId: id, ownerId: owner, requesterId: req,
  });

  it("flags classic A↔B farm (both trade only with each other)", () => {
    const pairs = findReciprocalOnlyPairs([
      txn("1", "A", "B"), txn("2", "B", "A"), txn("3", "A", "B"),
    ]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toEqual(["A", "B"]);
  });

  it("does not flag when A trades with B AND C", () => {
    expect(findReciprocalOnlyPairs([
      txn("1", "A", "B"),
      txn("2", "A", "C"),
      txn("3", "B", "D"),
      txn("4", "C", "D"),
    ])).toHaveLength(0);
  });

  it("skips self-transactions (ownerId === requesterId)", () => {
    const pairs = findReciprocalOnlyPairs([txn("1", "A", "A")]);
    expect(pairs).toHaveLength(0);
  });

  it("returns empty for empty transaction list", () => {
    expect(findReciprocalOnlyPairs([])).toHaveLength(0);
  });

  it("each unordered pair appears only once, not twice", () => {
    const pairs = findReciprocalOnlyPairs([txn("1", "A", "B"), txn("2", "B", "A")]);
    expect(pairs).toHaveLength(1);
  });
});

describe("anti-gaming — collusion groups", () => {
  const txn = (id: string, owner: string, req: string): CompletedTxn => ({
    transactionId: id, ownerId: owner, requesterId: req,
  });

  it("catches 3-person ring A→B→C→A", () => {
    const groups = findCollusionGroups([
      txn("1", "A", "B"), txn("2", "B", "C"), txn("3", "C", "A"),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toEqual(["A", "B", "C"]);
  });

  it("catches 4-person closed ring A↔B↔C↔D↔A", () => {
    const groups = findCollusionGroups([
      txn("1", "A", "B"), txn("2", "B", "C"),
      txn("3", "C", "D"), txn("4", "D", "A"),
      txn("5", "A", "C"), txn("6", "B", "D"),   // cross-links so everyone has ≥2 partners
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toEqual(["A", "B", "C", "D"]);
  });

  it("does not flag open chain A-B-D (D only trades with B)", () => {
    expect(findCollusionGroups([
      txn("1", "A", "B"), txn("2", "A", "C"), txn("3", "B", "D"),
    ])).toHaveLength(0);
  });

  it("does not report reciprocal pairs (size 2) — those are handled separately", () => {
    expect(findCollusionGroups([txn("1", "A", "B"), txn("2", "B", "A")])).toHaveLength(0);
  });

  it("returns empty for empty list", () => {
    expect(findCollusionGroups([])).toHaveLength(0);
  });
});

describe("anti-gaming — low diversity", () => {
  const txn = (id: string, owner: string, req: string): CompletedTxn => ({
    transactionId: id, ownerId: owner, requesterId: req,
  });

  it("does NOT flag user with only 1 completed transaction (new user guard)", () => {
    const flagged = findLowDiversityUsers([txn("1", "New", "Bob")]);
    expect(flagged).not.toContain("New");
  });

  it("does NOT flag user with exactly 2 completed transactions (still below minTransactions=3)", () => {
    const flagged = findLowDiversityUsers([txn("1", "New", "Bob"), txn("2", "New", "Bob")]);
    expect(flagged).not.toContain("New");
  });

  it("DOES flag user with 3 transactions and only 1 unique partner", () => {
    const flagged = findLowDiversityUsers([
      txn("1", "Farmer", "Victim"),
      txn("2", "Farmer", "Victim"),
      txn("3", "Farmer", "Victim"),
    ]);
    expect(flagged).toContain("Farmer");
    expect(flagged).toContain("Victim");
  });

  it("does NOT flag user who has 2+ unique partners (even with many transactions)", () => {
    const flagged = findLowDiversityUsers([
      txn("1", "Good", "Alice"),
      txn("2", "Good", "Bob"),
      txn("3", "Good", "Alice"),
    ]);
    expect(flagged).not.toContain("Good");
  });

  it("ignores self-transactions when counting diversity", () => {
    // Self-transactions are counted in buildCounterpartMap but skipped (ownerId !== requesterId guard)
    const flagged = findLowDiversityUsers([txn("1", "X", "X")]);
    expect(flagged).not.toContain("X");
  });

  it("returns empty for empty list", () => {
    expect(findLowDiversityUsers([])).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Time decay
// ---------------------------------------------------------------------------
describe("reputation time decay — shouldDecayUser", () => {
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const now = new Date("2026-06-04T00:00:00Z");
  const exactly30DaysAgo = new Date(now.getTime() - THIRTY_DAYS_MS);
  const justUnder30Days = new Date(now.getTime() - THIRTY_DAYS_MS + 1000); // 1 second short

  it("decays user inactive for exactly 30 days (boundary: >=)", () => {
    expect(shouldDecayUser({
      status: "ACTIVE", reputationScore: 10,
      createdAt: exactly30DaysAgo,
      lastReputationEventAt: exactly30DaysAgo,
    }, now)).toBe(true);
  });

  it("does NOT decay user inactive for 29 days 23 hours 59 minutes (just under boundary)", () => {
    expect(shouldDecayUser({
      status: "ACTIVE", reputationScore: 10,
      createdAt: justUnder30Days,
      lastReputationEventAt: justUnder30Days,
    }, now)).toBe(false);
  });

  it("falls back to createdAt when lastReputationEventAt is null", () => {
    expect(shouldDecayUser({
      status: "ACTIVE", reputationScore: 5,
      createdAt: new Date("2026-04-25T00:00:00Z"),  // 40 days ago → decay
      lastReputationEventAt: null,
    }, now)).toBe(true);

    expect(shouldDecayUser({
      status: "ACTIVE", reputationScore: 5,
      createdAt: new Date("2026-05-25T00:00:00Z"),  // 10 days ago → no decay
      lastReputationEventAt: null,
    }, now)).toBe(false);
  });

  it("does not decay SUSPENDED users", () => {
    expect(shouldDecayUser({
      status: "SUSPENDED", reputationScore: 50,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      lastReputationEventAt: null,
    }, now)).toBe(false);
  });

  it("does not decay DELETED users", () => {
    expect(shouldDecayUser({
      status: "DELETED", reputationScore: 50,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      lastReputationEventAt: null,
    }, now)).toBe(false);
  });

  it("does not decay users with score = 0", () => {
    expect(shouldDecayUser({
      status: "ACTIVE", reputationScore: 0,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      lastReputationEventAt: null,
    }, now)).toBe(false);
  });

  it("does decay users with score = 1 (minimum positive score)", () => {
    expect(shouldDecayUser({
      status: "ACTIVE", reputationScore: 1,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      lastReputationEventAt: null,
    }, now)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Moderation permission matrix
// ---------------------------------------------------------------------------
describe("moderation — full permission matrix", () => {
  const allActions = [
    "WARN", "REMOVE_LISTING", "SUSPEND_USER", "RESTORE",
    "RESOLVE_DISPUTE", "REJECT_DISPUTE", "REJECT_REPORT",
  ] as const;

  it("ADMIN can do all 7 actions", () => {
    for (const action of allActions) {
      expect(canCommunityModeratorApplyAction("ADMIN", action)).toBe(true);
    }
  });

  it("MODERATOR can do all 7 actions", () => {
    for (const action of allActions) {
      expect(canCommunityModeratorApplyAction("MODERATOR", action)).toBe(true);
    }
  });

  it("community mod (USER role) — allowed: WARN, REMOVE_LISTING, REJECT_REPORT", () => {
    expect(canCommunityModeratorApplyAction("USER", "WARN")).toBe(true);
    expect(canCommunityModeratorApplyAction("USER", "REMOVE_LISTING")).toBe(true);
    expect(canCommunityModeratorApplyAction("USER", "REJECT_REPORT")).toBe(true);
  });

  it("community mod (USER role) — blocked: SUSPEND_USER, RESTORE, RESOLVE_DISPUTE, REJECT_DISPUTE", () => {
    expect(canCommunityModeratorApplyAction("USER", "SUSPEND_USER")).toBe(false);
    expect(canCommunityModeratorApplyAction("USER", "RESTORE")).toBe(false);
    expect(canCommunityModeratorApplyAction("USER", "RESOLVE_DISPUTE")).toBe(false);
    expect(canCommunityModeratorApplyAction("USER", "REJECT_DISPUTE")).toBe(false);
  });

  it("GUEST role — same allowlist as USER (community-mod tier), not full mod access", () => {
    const allowed = ["WARN", "REMOVE_LISTING", "REJECT_REPORT"];
    for (const action of allActions) {
      expect(canCommunityModeratorApplyAction("GUEST", action)).toBe(allowed.includes(action));
    }
  });
});
