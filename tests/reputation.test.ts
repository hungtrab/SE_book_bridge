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


describe("reputation scoring", () => {
  it.each([
    [0, "new"],
    [19, "new"],
    [20, "active"],
    [49, "active"],
    [50, "trusted"],
    [79, "trusted"],
    [80, "champion"],
    [100, "champion"],
    [-5, "new"],     // clamps to floor
    [200, "champion"], // clamps to ceiling
  ])("score %d -> tier %s", (score, expected) => {
    expect(tierForScore(score)).toBe(expected);
  });

  it("rating deltas decrease monotonically with stars", () => {
    expect(deltaForRating(5)).toBeGreaterThan(deltaForRating(4));
    expect(deltaForRating(4)).toBeGreaterThan(deltaForRating(3));
    expect(deltaForRating(3)).toBeGreaterThanOrEqual(deltaForRating(2));
    expect(deltaForRating(2)).toBeGreaterThan(deltaForRating(1));
  });

  it("transition completed > rating five star (transactions weigh more)", () => {
    expect(ReputationWeights.TRANSACTION_COMPLETED)
      .toBeGreaterThan(ReputationWeights.RATING_FIVE_STAR);
  });

  it("tierLabel returns human-readable strings", () => {
    expect(tierLabel("new")).toBe("New Member");
    expect(tierLabel("champion")).toBe("Community Champion");
  });
});


describe("anti-gaming heuristics", () => {
  const txn = (id: string, owner: string, requester: string): CompletedTxn => ({
    transactionId: id, ownerId: owner, requesterId: requester,
  });

  it("flags a reciprocal-only pair", () => {
    // A and B only ever trade with each other.
    const pairs = findReciprocalOnlyPairs([
      txn("1", "A", "B"),
      txn("2", "B", "A"),
      txn("3", "A", "B"),
    ]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toEqual(["A", "B"]);
  });

  it("does not flag a healthy graph", () => {
    const pairs = findReciprocalOnlyPairs([
      txn("1", "A", "B"),
      txn("2", "A", "C"),
      txn("3", "B", "D"),
      txn("4", "C", "D"),
    ]);
    expect(pairs).toEqual([]);
  });

  it("low-diversity does not flag users with fewer than 3 transactions (new user guard)", () => {
    // User with only 1-2 completed transactions should NOT be flagged as low-diversity
    const flagged = findLowDiversityUsers([
      txn("1", "NewUser", "Bob"),
      txn("2", "NewUser", "Bob"),
    ]);
    expect(flagged).not.toContain("NewUser");
  });

  it("low-diversity flags users with 3+ transactions but only 1 unique partner", () => {
    const txns = [
      txn("1", "Farmer", "Victim"),
      txn("2", "Farmer", "Victim"),
      txn("3", "Farmer", "Victim"),
    ];
    const flagged = findLowDiversityUsers(txns);
    expect(flagged).toContain("Farmer");
    expect(flagged).toContain("Victim");
  });

  it("findCollusionGroups catches 3-person ring (A→B→C→A)", () => {
    const groups = findCollusionGroups([
      txn("1", "A", "B"),
      txn("2", "B", "C"),
      txn("3", "C", "A"),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toEqual(["A", "B", "C"]);
  });

  it("findCollusionGroups does not flag healthy open network", () => {
    // A trades with B and C; B also trades with D — open network, not a closed group
    const groups = findCollusionGroups([
      txn("1", "A", "B"),
      txn("2", "A", "C"),
      txn("3", "B", "D"),
    ]);
    expect(groups).toHaveLength(0);
  });

  it("findCollusionGroups ignores pairs (already handled by findReciprocalOnlyPairs)", () => {
    // A pair of size 2 should not appear in collusion groups (min size is 3)
    const groups = findCollusionGroups([txn("1", "A", "B"), txn("2", "B", "A")]);
    expect(groups).toHaveLength(0);
  });
});

describe("community moderator scope", () => {
  it("does not allow community moderators to suspend accounts globally", () => {
    expect(canCommunityModeratorApplyAction("USER", "REMOVE_LISTING")).toBe(true);
    expect(canCommunityModeratorApplyAction("USER", "SUSPEND_USER")).toBe(false);
    expect(canCommunityModeratorApplyAction("MODERATOR", "SUSPEND_USER")).toBe(true);
  });
});
