// book-match.ts — find marketplace listings that match a given book title.
//
// Used by the Artifacts "See this book on listing" feature so it can show the
// real listings users posted (gift / exchange / sell) for that book.
//
// Why fuzzy matching: a posted title can differ slightly from the artifact's
// canonical title (e.g. the artifact "The Alchemist" vs a listing typed as
// "The AIchemist"). Exact matching would miss those, so we score similarity
// (character-bigram Dice coefficient + substring containment) instead.
//
// Scale note: this scans up to CANDIDATE_LIMIT active listings and scores them
// in memory — fine for this project's size. For a very large catalog, switch to
// the pg_trgm extension with a GIN index to filter at the database layer.

import { prisma } from "../lib/prisma";

const SIMILARITY_THRESHOLD = 0.5;   // minimum score to count as a match
const CANDIDATE_LIMIT = 500;        // max active listings to scan

export interface MatchedListing {
  id: string;
  title: string;
  author: string;
  transactionType: string;          // GIFT | EXCHANGE | SELL
  askingPriceVnd: number | null;
  ownerName: string;
  photoUrl: string | null;
  score: number;                    // similarity 0..1 (1 = exact)
}

/**
 * Return active listings that best match `bookTitle`, highest similarity first,
 * capped at `limit`. Includes every transaction type (gift / exchange / sell).
 */
export async function findListingsForBook(bookTitle: string, limit = 6): Promise<MatchedListing[]> {
  if (!normalize(bookTitle)) return [];

  const candidates = await prisma.listing.findMany({
    where: { status: "ACTIVE" },              // only listings still available
    orderBy: { createdAt: "desc" },
    take: CANDIDATE_LIMIT,
    select: {
      id: true,
      title: true,
      author: true,
      transactionType: true,
      askingPriceVnd: true,
      owner: { select: { displayName: true } },
      photos: { take: 1, orderBy: { position: "asc" }, select: { url: true } },
    },
  });

  return candidates
    .map((l) => ({ l, score: titleSimilarity(bookTitle, l.title) }))
    .filter((x) => x.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ l, score }) => ({
      id: l.id,
      title: l.title,
      author: l.author,
      transactionType: l.transactionType,
      askingPriceVnd: l.askingPriceVnd,
      ownerName: l.owner.displayName,
      photoUrl: l.photos[0]?.url ?? null,
      score,
    }));
}

/**
 * Similarity between two book titles, 0..1.
 *  - exact (after normalisation) -> 1
 *  - one contains the other -> 0.95 (e.g. "The Alchemist" vs "Alchemist")
 *  - otherwise -> Dice coefficient ("Alchemist" vs "AIchemist" ~0.82)
 */
export function titleSimilarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.95;
  return diceCoefficient(na, nb);
}

// Normalise a title for fair comparison: strip diacritics, map đ->d, lowercase,
// drop everything that is not a letter or digit (spaces, punctuation).
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

// Dice coefficient over character bigrams: 2*|shared| / (|A| + |B|).
function diceCoefficient(a: string, b: string): number {
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;
  const bigrams = (s: string) => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  };
  const A = bigrams(a);
  const B = bigrams(b);
  let intersection = 0;
  let sizeA = 0;
  let sizeB = 0;
  for (const v of A.values()) sizeA += v;
  for (const v of B.values()) sizeB += v;
  for (const [g, c] of A) {
    const d = B.get(g);
    if (d) intersection += Math.min(c, d);
  }
  return (2 * intersection) / (sizeA + sizeB);
}
