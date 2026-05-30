// anti-gaming.ts — detects reputation-farming patterns.
//
// Two heuristics, both straight from the SRS:
//
//   1. "Reciprocal-only pairs" — two users whose completed-transaction
//      counterparties are *only each other*. This is the simplest gaming
//      pattern: A and B trade books back and forth to inflate scores.
//
//   2. "Zero-unique-counterparty accounts" — a user whose completed
//      transactions involve fewer than ``minUniqueCounterparties`` distinct
//      partners (default 2 — i.e. a single trading partner).
//
// Both heuristics are pure functions over a (already-fetched) list of
// transactions, so they're trivial to unit-test.

export interface CompletedTxn {
  transactionId: string;
  ownerId: string;
  requesterId: string;
}

/** Return the set of users with the reciprocal-only pattern. */
export function findReciprocalOnlyPairs(
  transactions: CompletedTxn[],
): Array<[string, string]> {
  // Map each user -> set of distinct counterparties.
  const counterparts = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (!counterparts.has(a)) counterparts.set(a, new Set());
    counterparts.get(a)!.add(b);
  };
  for (const t of transactions) {
    if (t.ownerId === t.requesterId) continue;
    add(t.ownerId, t.requesterId);
    add(t.requesterId, t.ownerId);
  }

  const pairs: Array<[string, string]> = [];
  for (const [user, partners] of counterparts.entries()) {
    if (partners.size === 1) {
      const [other] = [...partners];
      const otherPartners = counterparts.get(other);
      if (otherPartners?.size === 1 && [...otherPartners][0] === user) {
        // Reciprocal-only. Add the unordered pair once.
        if (user < other) pairs.push([user, other]);
      }
    }
  }
  return pairs;
}

/** Users whose distinct-counterparty count is below ``threshold`` (default 2). */
export function findLowDiversityUsers(
  transactions: CompletedTxn[],
  threshold = 2,
): string[] {
  const counterparts = new Map<string, Set<string>>();
  for (const t of transactions) {
    for (const [me, them] of [[t.ownerId, t.requesterId], [t.requesterId, t.ownerId]] as const) {
      if (!counterparts.has(me)) counterparts.set(me, new Set());
      counterparts.get(me)!.add(them);
    }
  }
  const flagged: string[] = [];
  for (const [user, partners] of counterparts.entries()) {
    if (partners.size > 0 && partners.size < threshold) flagged.push(user);
  }
  return flagged;
}
