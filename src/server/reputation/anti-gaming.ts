// anti-gaming.ts — detects reputation-farming patterns.
//
// Three heuristics:
//
//   1. "Reciprocal-only pairs" — two users whose completed-transaction
//      counterparties are *only each other*. A and B trade back and forth
//      to inflate scores.
//
//   2. "Closed collusion groups" — groups of 3+ users who trade exclusively
//      within the group (A→B→C→A ring). Reciprocal pairs are a special case
//      (size 2) already covered by heuristic 1; this catches rings of 3–10.
//
//   3. "Low-diversity accounts" — users with fewer than minUniqueCounterparties
//      distinct partners AND at least minTransactions completed trades.
//      The minTransactions guard prevents flagging legitimate new users who
//      have only completed their first 1–2 trades.
//
// All three are pure functions (no DB), trivial to unit-test.

export interface CompletedTxn {
  transactionId: string;
  ownerId: string;
  requesterId: string;
}

/** Return the set of users with the reciprocal-only pattern. */
export function findReciprocalOnlyPairs(
  transactions: CompletedTxn[],
): Array<[string, string]> {
  const counterparts = buildCounterpartMap(transactions);
  const pairs: Array<[string, string]> = [];
  for (const [user, partners] of counterparts.entries()) {
    if (partners.size === 1) {
      const [other] = [...partners];
      const otherPartners = counterparts.get(other);
      if (otherPartners?.size === 1 && [...otherPartners][0] === user) {
        if (user < other) pairs.push([user, other]);
      }
    }
  }
  return pairs;
}

/**
 * Find closed collusion groups of size 3–maxGroupSize where every member
 * trades exclusively with other members of the group.
 * Returns arrays of sorted user IDs (one array per group).
 */
export function findCollusionGroups(
  transactions: CompletedTxn[],
  maxGroupSize = 10,
): string[][] {
  const counterparts = buildCounterpartMap(transactions);
  const groups: string[][] = [];
  const visited = new Set<string>();

  for (const [user] of counterparts.entries()) {
    if (visited.has(user)) continue;

    // BFS: expand the candidate group starting from this user
    const candidate = new Set<string>([user]);
    const queue = [user];
    while (queue.length) {
      const current = queue.shift()!;
      for (const partner of counterparts.get(current) ?? []) {
        if (!candidate.has(partner)) {
          candidate.add(partner);
          queue.push(partner);
        }
      }
    }

    if (candidate.size < 3 || candidate.size > maxGroupSize) continue;

    // A closed group means every member's counterparts are ALL within the group
    const isClosed = [...candidate].every((member) => {
      const memberPartners = counterparts.get(member) ?? new Set<string>();
      // All trades must be within the group (no external connections)
      const allInternal = [...memberPartners].every((p) => candidate.has(p));
      // Must trade with ≥2 others inside the group — filters out leaf nodes in open chains
      const internalDegree = [...memberPartners].filter((p) => candidate.has(p)).length;
      return allInternal && internalDegree >= 2;
    });

    if (isClosed) {
      const sorted = [...candidate].sort();
      groups.push(sorted);
      for (const u of candidate) visited.add(u);
    }
  }
  return groups;
}

/**
 * Users whose distinct-counterparty count is below threshold AND who have
 * completed at least minTransactions trades.
 * minTransactions=3 prevents flagging legitimate users on their first trade.
 */
export function findLowDiversityUsers(
  transactions: CompletedTxn[],
  threshold = 2,
  minTransactions = 3,
): string[] {
  const counterparts = new Map<string, Set<string>>();
  const txnCount = new Map<string, number>();

  for (const t of transactions) {
    if (t.ownerId === t.requesterId) continue;
    for (const [me, them] of [[t.ownerId, t.requesterId], [t.requesterId, t.ownerId]] as const) {
      if (!counterparts.has(me)) counterparts.set(me, new Set());
      counterparts.get(me)!.add(them);
      txnCount.set(me, (txnCount.get(me) ?? 0) + 1);
    }
  }

  const flagged: string[] = [];
  for (const [user, partners] of counterparts.entries()) {
    const count = txnCount.get(user) ?? 0;
    if (count >= minTransactions && partners.size > 0 && partners.size < threshold) {
      flagged.push(user);
    }
  }
  return flagged;
}

function buildCounterpartMap(transactions: CompletedTxn[]): Map<string, Set<string>> {
  const counterparts = new Map<string, Set<string>>();
  for (const t of transactions) {
    if (t.ownerId === t.requesterId) continue;
    for (const [me, them] of [[t.ownerId, t.requesterId], [t.requesterId, t.ownerId]] as const) {
      if (!counterparts.has(me)) counterparts.set(me, new Set());
      counterparts.get(me)!.add(them);
    }
  }
  return counterparts;
}
