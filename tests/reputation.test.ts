import { describe, expect, it } from "vitest";

import {
  deltaForRating,
  ReputationWeights,
  tierForScore,
  tierLabel,
} from "@/server/reputation/scoring";

import {
  findLowDiversityUsers,
  findReciprocalOnlyPairs,
  type CompletedTxn,
} from "@/server/reputation/anti-gaming";


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

  it("low-diversity threshold flags users with single partner", () => {
    const flagged = findLowDiversityUsers([
      txn("1", "X", "Y"),
      txn("2", "Y", "X"),    // X and Y both have only 1 counterparty
      txn("3", "Z", "W"),    // Z has only W
      txn("4", "W", "P"),    // W now has 2 partners: Z and P; P has only W
    ]);
    // X, Y, Z, P should be flagged (one counterparty each); W has 2.
    expect(new Set(flagged)).toEqual(new Set(["X", "Y", "Z", "P"]));
  });
});
