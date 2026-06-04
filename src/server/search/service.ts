import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { BOOK_CONDITIONS, TRANSACTION_TYPES } from "../listings/validation";
import { districtsWithinRadius } from "./districts";
import { parseSearchQuery } from "./query-parser";

export const SearchSchema = z.object({
  q: z.string().trim().max(300).optional(),
  genre: z.string().trim().min(1).max(64).optional(),
  author: z.string().trim().min(1).max(200).optional(),
  isbn: z.string().trim().min(1).max(20).optional(),
  condition: z.enum(BOOK_CONDITIONS).optional(),
  transactionType: z.enum(TRANSACTION_TYPES).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  communityId: z.string().trim().min(1).optional(),
  district: z.string().trim().min(1).max(120).optional(),
  distanceKm: z.coerce.number().int().min(1).max(50).optional(),
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type SearchInput = z.infer<typeof SearchSchema>;

type RankedId = { id: string; rank: number };

export async function searchListings(input: SearchInput) {
  const data = SearchSchema.parse(input);
  const parsed = parseSearchQuery(data.q ?? "");
  const text = parsed.text;
  const genre = data.genre ?? parsed.filters.genre;
  const author = data.author ?? parsed.filters.author;
  const isbn = (data.isbn ?? parsed.filters.isbn)?.replace(/[-\s]/g, "").toUpperCase();
  const condition = validCondition(data.condition ?? parsed.filters.condition);
  const transactionType = validType(data.transactionType ?? parsed.filters.type);
  const communityId = data.communityId ?? parsed.filters.community;
  const district = data.district ?? parsed.filters.district;
  const districts = district ? districtsWithinRadius(district, data.distanceKm ?? 0) : [];
  const offset = decodeCursor(data.cursor);

  const filters: Prisma.Sql[] = [Prisma.sql`l."status" = 'ACTIVE'::"ListingStatus"`];
  if (text) filters.push(Prisma.sql`l.search_vector @@ websearch_to_tsquery('simple', ${text})`);
  if (genre) filters.push(Prisma.sql`LOWER(l."genre") = LOWER(${genre})`);
  if (author) filters.push(Prisma.sql`l."author" ILIKE ${`%${author}%`}`);
  if (isbn) filters.push(Prisma.sql`l."isbn" = ${isbn}`);
  if (condition) filters.push(Prisma.sql`l."condition" = ${condition}::"BookCondition"`);
  if (transactionType) filters.push(Prisma.sql`l."transactionType" = ${transactionType}::"TransactionType"`);
  if (data.maxPrice !== undefined) filters.push(Prisma.sql`COALESCE(l."askingPriceVnd", 0) <= ${data.maxPrice}`);
  if (communityId) filters.push(Prisma.sql`(l."communityId" = ${communityId} OR c."name" ILIKE ${communityId})`);
  if (districts.length > 0) filters.push(Prisma.sql`u."locationDistrict" IN (${Prisma.join(districts)})`);

  const rank = text
    ? Prisma.sql`ts_rank(l.search_vector, websearch_to_tsquery('simple', ${text}))`
    : Prisma.sql`0::real`;
  const ranked = await prisma.$queryRaw<RankedId[]>(Prisma.sql`
    SELECT l.id, ${rank} AS rank
    FROM "Listing" l
    JOIN "User" u ON u.id = l."ownerId"
    LEFT JOIN "Community" c ON c.id = l."communityId"
    WHERE ${Prisma.join(filters, " AND ")}
    ORDER BY rank DESC, l."createdAt" DESC, l.id DESC
    LIMIT ${data.pageSize + 1} OFFSET ${offset}
  `);
  const page = ranked.slice(0, data.pageSize);
  const listings = await prisma.listing.findMany({
    where: { id: { in: page.map((row) => row.id) } },
    include: {
      photos: { take: 1, orderBy: { position: "asc" } },
      owner: { select: { id: true, displayName: true, reputationScore: true, reputationTier: true, locationDistrict: true } },
      community: { select: { id: true, name: true } },
    },
  });
  const byId = new Map(listings.map((listing) => [listing.id, listing]));
  return {
    items: page.flatMap((row) => {
      const listing = byId.get(row.id);
      return listing ? [{ ...listing, relevance: Number(row.rank) }] : [];
    }),
    nextCursor: ranked.length > data.pageSize ? encodeCursor(offset + data.pageSize) : null,
    parsedQuery: { text, filters: { genre, author, isbn, condition, transactionType, communityId, district } },
  };
}

export async function relatedListings(listingId: string, take = 4) {
  const source = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { author: true, genre: true, communityId: true },
  });
  if (!source) return [];
  const rows = await prisma.listing.findMany({
    where: {
      id: { not: listingId },
      status: "ACTIVE",
      OR: [
        { author: { equals: source.author, mode: "insensitive" } },
        { genre: source.genre },
        ...(source.communityId ? [{ communityId: source.communityId }] : []),
      ],
    },
    include: { photos: { take: 1, orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: take * 3,
  });
  return rows
    .map((listing) => ({
      ...listing,
      relatedScore: Number(listing.author.toLowerCase() === source.author.toLowerCase()) * 3
        + Number(listing.genre === source.genre) * 2
        + Number(Boolean(source.communityId && listing.communityId === source.communityId)),
    }))
    .sort((a, b) => b.relatedScore - a.relatedScore)
    .slice(0, take);
}

function validCondition(value?: string) {
  return BOOK_CONDITIONS.find((item) => item === value?.toUpperCase());
}

function validType(value?: string) {
  return TRANSACTION_TYPES.find((item) => item === value?.toUpperCase());
}

function encodeCursor(offset: number) {
  return Buffer.from(String(offset)).toString("base64url");
}

function decodeCursor(cursor?: string) {
  if (!cursor) return 0;
  const value = Number(Buffer.from(cursor, "base64url").toString("utf8"));
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}
