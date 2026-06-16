// listings/service.ts — listing CRUD with price-cap and edit-block guards.

import type { ListingStatus, Prisma, User } from "@prisma/client";

import { prisma } from "../lib/prisma";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../lib/errors";
import {
  cleanListingData,
  ListingCreateSchema,
  ListingPatchSchema,
  type ListingCreateInput,
  type ListingPatchInput,
  type ListingQueryInput,
} from "./validation";
import { emitListingCreated } from "./fanout";

export { ListingCreateSchema, ListingPatchSchema, ListingQuerySchema } from "./validation";

const ACTIVE_TRANSACTION_STATUSES = ["ACCEPTED", "IN_DELIVERY"] as const;
const DELETE_BLOCKING_TRANSACTION_STATUSES = ["ACCEPTED", "IN_DELIVERY"] as const;
const PENDING_EDIT_NOTIFICATION_STATUSES = ["PENDING"] as const;

export async function createListing(user: User, input: ListingCreateInput) {
  const data = cleanListingData(ListingCreateSchema.parse(input));

  return prisma.$transaction(async (tx) => {
    if (data.communityId) {
      const membership = await tx.communityMembership.findUnique({
        where: { userId_communityId: { userId: user.id, communityId: data.communityId } },
      });
      if (!membership) throw new ForbiddenError("Join the community before publishing there");
    }
    const listing = await tx.listing.create({
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
          create: (data.photoUrls ?? []).map((url, i) => ({ url, position: i })),
        },
      },
      include: listingInclude(),
    });
    await emitListingCreated(tx, {
      id: listing.id,
      ownerId: listing.ownerId,
      title: listing.title,
      author: listing.author,
      genre: listing.genre,
      transactionType: listing.transactionType,
      communityId: listing.communityId,
    });
    return listing;
  });
}

export async function getListing(id: string) {
  const listing = await prisma.listing.findFirst({
    where: { id, status: { not: "REMOVED" } },
    include: listingInclude(),
  });
  if (!listing) throw new NotFoundError("Listing not found");
  return listing;
}

export async function patchListing(user: User, id: string, input: ListingPatchInput) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      transactions: {
        where: { status: { in: [...ACTIVE_TRANSACTION_STATUSES, ...PENDING_EDIT_NOTIFICATION_STATUSES] } },
        select: { id: true, requesterId: true, status: true },
      },
    },
  });
  if (!listing || listing.status === "REMOVED") throw new NotFoundError("Listing not found");
  if (listing.ownerId !== user.id) throw new ForbiddenError();
  if (hasActiveListingTransaction(listing.transactions.map((transaction) => transaction.status))) {
    throw new ConflictError("Cannot edit a listing with an active transaction");
  }

  const data = cleanListingData(ListingPatchSchema.parse(input));
  const { communityId, photoUrls, ...listingData } = data;
  const updateData: Prisma.ListingUpdateInput = {
    ...listingData,
    ...(communityId !== undefined ? { community: { connect: { id: communityId } } } : {}),
  };

  return prisma.$transaction(async (tx) => {
    if (communityId) {
      const membership = await tx.communityMembership.findUnique({
        where: { userId_communityId: { userId: user.id, communityId } },
      });
      if (!membership) throw new ForbiddenError("Join the community before publishing there");
    }
    if (photoUrls) {
      await tx.listingPhoto.deleteMany({ where: { listingId: id } });
      await tx.listingPhoto.createMany({
        data: photoUrls.map((url, position) => ({ listingId: id, url, position })),
      });
    }
    const updated = await tx.listing.update({
      where: { id },
      data: updateData,
      include: listingInclude(),
    });
    const pendingRequests = listing.transactions.filter((transaction) => transaction.status === "PENDING");
    if (pendingRequests.length > 0 && listingPatchChangesPendingRequestFields(listing, data)) {
      await tx.notification.createMany({
        data: pendingRequests.map((transaction) => ({
          userId: transaction.requesterId,
          kind: "TRANSACTION_STATUS_CHANGED",
          payload: {
            kind: "listing.updated",
            actorId: user.id,
            listingId: listing.id,
            transactionId: transaction.id,
            changedFields: changedPendingRequestFields(listing, data),
          },
        })),
      });
    }
    return updated;
  });
}

export async function deleteListing(user: User, id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      transactions: {
        where: { status: { in: [...DELETE_BLOCKING_TRANSACTION_STATUSES] } },
        select: { id: true },
      },
    },
  });
  if (!listing || listing.status === "REMOVED") throw new NotFoundError("Listing not found");

  const isOwner = listing.ownerId === user.id;
  const isAdmin = user.role === "ADMIN";
  let isCommunityMod = false;
  let isCommunityOwner = false;
  if (!isOwner && !isAdmin && listing.communityId) {
    const community = await prisma.community.findUnique({
      where: { id: listing.communityId },
      select: { ownerId: true },
    });
    if (community?.ownerId === user.id) {
      isCommunityOwner = true;
    } else {
      const membership = await prisma.communityMembership.findUnique({
        where: { userId_communityId: { userId: user.id, communityId: listing.communityId } },
        select: { role: true },
      });
      if (membership?.role === "MODERATOR") {
        isCommunityMod = true;
      }
    }
  }

  if (!isOwner && !isAdmin && !isCommunityMod && !isCommunityOwner) {
    throw new ForbiddenError();
  }

  if (listing.transactions.length > 0) {
    throw new ConflictError("Cannot delete a listing with an active transaction");
  }

  await prisma.$transaction(async (tx) => {
    await tx.transaction.updateMany({
      where: { listingId: id, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    await tx.listing.update({ where: { id }, data: { status: "REMOVED" } });
  });
  return { ok: true };
}

export async function searchListings(opts: ListingQueryInput) {
  const pageSize = Math.min(opts.pageSize ?? 20, 50);
  const where = {
    status: "ACTIVE" as const,
    ...(opts.q
      ? {
          OR: [
            { title: { contains: opts.q, mode: "insensitive" as const } },
            { author: { contains: opts.q, mode: "insensitive" as const } },
            { description: { contains: opts.q, mode: "insensitive" as const } },
            { genre: { contains: opts.q, mode: "insensitive" as const } },
            { community: { name: { contains: opts.q, mode: "insensitive" as const } } },
            { isbn: opts.q.replace(/[-\s]/g, "").toUpperCase() },
          ],
        }
      : {}),
    ...(opts.genre ? { genre: opts.genre } : {}),
    ...(opts.condition ? { condition: opts.condition } : {}),
    ...(opts.transactionType ? { transactionType: opts.transactionType } : {}),
    ...(opts.maxPrice !== undefined ? { askingPriceVnd: { lte: opts.maxPrice } } : {}),
    ...(opts.communityId ? { communityId: opts.communityId } : {}),
  };

  const rows = await prisma.listing.findMany({
    where,
    include: {
      photos: { take: 1, orderBy: { position: "asc" } },
      owner: { select: { id: true, displayName: true, reputationTier: true } },
    },
    orderBy: { createdAt: "desc" },
    take: pageSize + 1,
    cursor: opts.cursor ? { id: opts.cursor } : undefined,
    skip: opts.cursor ? 1 : 0,
  });

  return {
    items: rows.slice(0, pageSize),
    nextCursor: rows.length > pageSize ? rows[pageSize].id : null,
  };
}

export async function markReserved(listingId: string) {
  return markListingStatus(listingId, "RESERVED");
}

export async function markActive(listingId: string) {
  return markListingStatus(listingId, "ACTIVE");
}

export async function markCompleted(listingId: string) {
  return markListingStatus(listingId, "COMPLETED");
}

export function hasActiveListingTransaction(statuses: string[]): boolean {
  return statuses.some((status) => ACTIVE_TRANSACTION_STATUSES.includes(
    status as (typeof ACTIVE_TRANSACTION_STATUSES)[number],
  ));
}

export function listingPatchChangesPendingRequestFields(
  listing: { condition: string; askingPriceVnd: number | null },
  patch: { condition?: string; askingPriceVnd?: number },
) {
  return changedPendingRequestFields(listing, patch).length > 0;
}

function changedPendingRequestFields(
  listing: { condition: string; askingPriceVnd: number | null },
  patch: { condition?: string; askingPriceVnd?: number },
) {
  const fields: Array<"condition" | "askingPriceVnd"> = [];
  if (patch.condition !== undefined && patch.condition !== listing.condition) fields.push("condition");
  if (patch.askingPriceVnd !== undefined && patch.askingPriceVnd !== listing.askingPriceVnd) fields.push("askingPriceVnd");
  return fields;
}

async function markListingStatus(listingId: string, status: ListingStatus) {
  return prisma.listing.update({ where: { id: listingId }, data: { status } });
}

function listingInclude() {
  return {
    photos: { orderBy: { position: "asc" as const } },
    owner: { select: { id: true, displayName: true, reputationTier: true, reputationScore: true } },
    community: { select: { id: true, name: true } },
  };
}
