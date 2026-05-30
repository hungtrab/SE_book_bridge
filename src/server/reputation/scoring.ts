// scoring.ts — reputation scoring rules.
//
// The total score is the sum of `delta` values across `ReputationEvent`
// rows for the user. The tier is derived purely from the score per the
// table in the SRS slides (§07 — Reputation & Trust):
//
//   New Member         0–19
//   Active Sharer     20–49
//   Trusted Contributor 50–79
//   Community Champion  80–100
//
// Negative scores clamp to 0 for the tier label (the SRS leaves negative
// behaviour unspecified — flagging is delegated to the moderation queue).
//
// Tunable weights are exposed so the team can adjust them later without
// touching call sites.

export const ReputationWeights = {
  TRANSACTION_COMPLETED:     10,
  RATING_FIVE_STAR:           5,
  RATING_FOUR_STAR:           3,
  RATING_THREE_STAR:          0,
  RATING_TWO_STAR:           -3,
  RATING_ONE_STAR:           -5,
  REPORT_UPHELD:            -15,
  CANCELLATION:              -3,
  COMMUNITY_CONTRIBUTION:    +5,
  TIME_DECAY_PER_30_DAYS:    -1,    // applied by a daily job
} as const;

export type ReputationTier = "new" | "active" | "trusted" | "champion";

export function tierForScore(score: number): ReputationTier {
  const s = Math.max(0, Math.min(100, score));
  if (s < 20)  return "new";
  if (s < 50)  return "active";
  if (s < 80)  return "trusted";
  return "champion";
}

export function tierLabel(tier: ReputationTier): string {
  switch (tier) {
    case "new":      return "New Member";
    case "active":   return "Active Sharer";
    case "trusted":  return "Trusted Contributor";
    case "champion": return "Community Champion";
  }
}

export function deltaForRating(stars: 1 | 2 | 3 | 4 | 5): number {
  switch (stars) {
    case 5: return ReputationWeights.RATING_FIVE_STAR;
    case 4: return ReputationWeights.RATING_FOUR_STAR;
    case 3: return ReputationWeights.RATING_THREE_STAR;
    case 2: return ReputationWeights.RATING_TWO_STAR;
    case 1: return ReputationWeights.RATING_ONE_STAR;
  }
}
