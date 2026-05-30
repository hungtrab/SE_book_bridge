// listings/service.ts — listing CRUD with price-cap and edit-block guards.

import { z } from "zod";
import type { User } from "@prisma/client";

import { prisma } from "../lib/prisma";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../lib/errors";


const PRICE_CAP_VND = parseInt(process.env.SALE_PRICE_CAP_VND ?? "50000", 10);

export const ListingCreateSchema = z.object({
  title:           z.string().min(1).max(200),
  author:          z.string().min(1).max(200),
  isbn:            z.string().min(10).max(13).optional(),
  publisher:       z.string().max(200).optional(),
  publicationYear: z.number().int().min(1500).max(2100).optional(),
  language:        z.string().max(10).optional(),
  genre:           z.string().min(1).max(64),
  condition:       z.enum(["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"]),
  description:     z.string().min(20).max(2000),
  transactionType: z.enum(["GIFT", "EXCHANGE", "SELL"]),
  askingPriceVnd:  z.number().int().min(0).max(PRICE_CAP_VND).optional(),
  communityId:     z.string().optional(),
  photoUrls:       z.array(z.string().url()).min(1).max(5),
});

export const ListingPatchSchema = ListingCreateSchema
  .omit({ photoUrls: true })
  .partial();


export async function createListing(user: User, input: z.infer<typeof ListingCreateSchema>) {
  const data = ListingCreateSchema.parse(input);
  if (data.transactionType === "SELL") {
    if (data.askingPriceVnd === undefined)
      throw new BadRequestError("Sell listings must include askingPriceVnd");
    if (data.askingPriceVnd > PRICE_CAP_VND)
      throw new BadRequestError(`Asking price exceeds the cap of ${PRICE_CAP_VND} VND`);
  } else if (data.askingPriceVnd !== undefined) {
    throw new BadRequestError("askingPriceVnd is only allowed for SELL listings");
  }

  return prisma.listing.create({
    data: {
      ownerId: user.id,
      title: data.title,
      author: data.author,
      isbn: data.isbn,
      publisher: data.publisher,
      publicationYear: data.publicationYear,
      language: data.language,
      genre: data.genre,
      condition: data.condition,
      description: data.description,
      transactionType: data.transactionType,
      askingPriceVnd: data.askingPriceVnd,
      communityId: data.communityId,
      photos: {
        create: data.photoUrls.map((url, i) => ({ url, position: i })),
      },
    },
    include: { photos: true },
  });
}

export async function getListing(id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { photos: true, owner: { select: { id: true, displayName: true, reputationTier: true } } },
  });
  if (!listing) throw new NotFoundError("Listing not found");
  return listing;
}

export async function patchListing(user: User, id: string, input: z.infer<typeof ListingPatchSchema>) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { transactions: { where: { status: { in: ["ACCEPTED", "IN_DELIVERY"] } } } },
  });
  if (!listing) throw new NotFoundError("Listing not found");
  if (listing.ownerId !== user.id) throw new ForbiddenError();
  if (listing.transactions.length > 0)
    throw new ConflictError("Cannot edit a listing with an active transaction");

  const data = ListingPatchSchema.parse(input);
  if (data.transactionType === "SELL"
      && data.askingPriceVnd !== undefined
      && data.askingPriceVnd > PRICE_CAP_VND) {
    throw new BadRequestError(`Asking price exceeds the cap of ${PRICE_CAP_VND} VND`);
  }
  return prisma.listing.update({ where: { id }, data });
}

export async function deleteListing(user: User, id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { transactions: { where: { status: { in: ["PENDING", "ACCEPTED", "IN_DELIVERY"] } } } },
  });
  if (!listing) throw new NotFoundError("Listing not found");
  if (listing.ownerId !== user.id) throw new ForbiddenError();
  // Cancel pending requests is the responsibility of #4's domain events;
  // here we just soft-delete by flipping status.
  await prisma.listing.update({ where: { id }, data: { status: "REMOVED" } });
}

export async function searchListings(opts: {
  q?: string; genre?: string; condition?: string; transactionType?: string;
  maxPrice?: number; communityId?: string; cursor?: string; pageSize?: number;
}) {
  const pageSize = Math.min(opts.pageSize ?? 20, 50);
  const where: Record<string, unknown> = { status: "ACTIVE" };
  if (opts.q)              where["OR"] = [
                              { title:       { contains: opts.q, mode: "insensitive" } },
                              { author:      { contains: opts.q, mode: "insensitive" } },
                              { description: { contains: opts.q, mode: "insensitive" } },
                              { isbn: opts.q },
                            ];
  if (opts.genre)           where["genre"]           = opts.genre;
  if (opts.condition)       where["condition"]       = opts.condition;
  if (opts.transactionType) where["transactionType"] = opts.transactionType;
  if (opts.maxPrice !== undefined)
    where["askingPriceVnd"] = { lte: opts.maxPrice };
  if (opts.communityId)     where["communityId"]     = opts.communityId;

  return prisma.listing.findMany({
    where,
    include: { photos: { take: 1, orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: pageSize + 1,
    cursor: opts.cursor ? { id: opts.cursor } : undefined,
    skip: opts.cursor ? 1 : 0,
  });
}
