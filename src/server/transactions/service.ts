// transactions service — wires the state machine to Prisma atomically.

import { Prisma, type TransactionStatus, type User } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../lib/errors";
import { transition, type SideEffect, type TxnAction } from "./state-machine";
import { dispatchNotifications } from "../notifications/dispatcher";
import { addReputationEvent } from "../reputation/service";

export const RequestSchema = z.object({ listingId: z.string().min(1) });
export const ActionReasonSchema = z.object({ reason: z.string().trim().max(500).optional() });
export const ShipSchema = z.object({
  deliveryMethod: z.enum(["IN_PERSON", "POSTAL"]),
  trackingNumber: z.string().trim().max(120).optional(),
}).superRefine((data, ctx) => {
  if (data.deliveryMethod === "POSTAL" && !data.trackingNumber) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["trackingNumber"], message: "Postal delivery requires a tracking number" });
  }
});

type ActionMeta = { reason?: string; deliveryMethod?: "IN_PERSON" | "POSTAL"; trackingNumber?: string };
const OPEN_REQUEST_STATUSES: TransactionStatus[] = ["PENDING", "WAITLISTED", "ACCEPTED", "IN_DELIVERY", "DISPUTED"];

export async function requestListing(user: User, input: z.infer<typeof RequestSchema>) {
  const data = RequestSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const listing = await tx.listing.findUnique({ where: { id: data.listingId } });
    if (!listing) throw new NotFoundError("Listing not found");
    if (listing.status !== "ACTIVE") throw new BadRequestError(`Listing is ${listing.status}, not available`);
    if (listing.ownerId === user.id) throw new BadRequestError("You cannot request your own listing");
    const existing = await tx.transaction.findFirst({
      where: { listingId: listing.id, requesterId: user.id, status: { in: OPEN_REQUEST_STATUSES } },
      select: { id: true },
    });
    if (existing) throw new ConflictError("You already have an open request for this listing");
    return tx.transaction.create({
      data: {
        listingId: listing.id, ownerId: listing.ownerId, requesterId: user.id,
        type: listing.transactionType, agreedPriceVnd: listing.askingPriceVnd, status: "PENDING",
        events: { create: [{ toStatus: "PENDING", byUserId: user.id }] },
      },
      include: transactionInclude(),
    });
  });
}

export async function listMyTransactions(userId: string, status?: TransactionStatus) {
  return prisma.transaction.findMany({
    where: { OR: [{ ownerId: userId }, { requesterId: userId }], ...(status ? { status } : {}) },
    include: {
      listing: { include: { photos: { take: 1, orderBy: { position: "asc" } } } },
      owner: { select: { id: true, displayName: true } }, requester: { select: { id: true, displayName: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getTransaction(user: User, id: string) {
  const txn = await prisma.transaction.findUnique({ where: { id }, include: transactionInclude() });
  if (!txn) throw new NotFoundError("Transaction not found");
  if (!canViewTransaction(user, txn)) throw new ForbiddenError();
  return txn;
}

export async function applyAction(user: User, txnId: string, action: TxnAction, meta: ActionMeta = {}) {
  return prisma.$transaction(async (tx) => {
    const txn = await tx.transaction.findUnique({ where: { id: txnId } });
    if (!txn) throw new NotFoundError("Transaction not found");
    assertActor(user, txn, action);
    const result = transition(txn.status, action);
    if (!result.ok) throw new BadRequestError(result.reason);
    const updated = await tx.transaction.updateMany({
      where: { id: txn.id, status: txn.status },
      data: {
        status: result.next,
        ...(result.next === "ACCEPTED" ? { acceptedAt: new Date() } : {}),
        ...(result.next === "IN_DELIVERY" ? { shippedAt: new Date(), deliveryMethod: meta.deliveryMethod, trackingNumber: meta.trackingNumber } : {}),
        ...(result.next === "COMPLETED" ? { completedAt: new Date() } : {}),
      },
    });
    if (updated.count !== 1) throw new ConflictError("Transaction changed while processing; retry the action");
    await tx.transactionEvent.create({ data: { transactionId: txn.id, fromStatus: txn.status, toStatus: result.next, byUserId: user.id, reason: meta.reason } });
    for (const effect of result.sideEffects) await applySideEffect(tx, txn, effect, user.id);
    if (action.kind === "accept") {
      await waitlistOtherRequests(tx, txn, user.id);
      await ensureTransactionConversation(tx, txn);
    }
    if (action.kind === "cancel" && txn.status === "ACCEPTED") await promoteOldestWaitlisted(tx, txn.listingId, user.id);
    return { status: result.next };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function applyTransactionActionInTx(
  tx: Prisma.TransactionClient,
  user: User,
  txnId: string,
  action: TxnAction,
  meta: ActionMeta = {},
) {
  const txn = await tx.transaction.findUnique({ where: { id: txnId } });
  if (!txn) throw new NotFoundError("Transaction not found");
  assertActor(user, txn, action);
  const result = transition(txn.status, action);
  if (!result.ok) throw new BadRequestError(result.reason);
  const updated = await tx.transaction.updateMany({
    where: { id: txn.id, status: txn.status },
    data: {
      status: result.next,
      ...(result.next === "ACCEPTED" ? { acceptedAt: new Date() } : {}),
      ...(result.next === "IN_DELIVERY" ? { shippedAt: new Date(), deliveryMethod: meta.deliveryMethod, trackingNumber: meta.trackingNumber } : {}),
      ...(result.next === "COMPLETED" ? { completedAt: new Date() } : {}),
    },
  });
  if (updated.count !== 1) throw new ConflictError("Transaction changed while processing; retry the action");
  await tx.transactionEvent.create({
    data: {
      transactionId: txn.id,
      fromStatus: txn.status,
      toStatus: result.next,
      byUserId: user.id,
      reason: meta.reason,
    },
  });
  for (const effect of result.sideEffects) await applySideEffect(tx, txn, effect, user.id);
  return { status: result.next };
}

export async function autoCompleteTransaction(txnId: string) {
  return prisma.$transaction(async (tx) => {
    const txn = await tx.transaction.findUnique({ where: { id: txnId } });
    if (!txn) throw new NotFoundError("Transaction not found");
    const result = transition(txn.status, { kind: "complete", actor: "system" });
    if (!result.ok) return { status: txn.status, skipped: true };
    const updated = await tx.transaction.updateMany({ where: { id: txn.id, status: "IN_DELIVERY" }, data: { status: "COMPLETED", completedAt: new Date() } });
    if (updated.count !== 1) return { status: txn.status, skipped: true };
    await tx.transactionEvent.create({ data: { transactionId: txn.id, fromStatus: txn.status, toStatus: "COMPLETED", byUserId: txn.requesterId, reason: "system_auto_complete_after_21_days" } });
    for (const effect of result.sideEffects) await applySideEffect(tx, txn, effect, "system");
    return { status: "COMPLETED" as const, skipped: false };
  });
}

function assertActor(user: User, txn: { ownerId: string; requesterId: string }, action: TxnAction) {
  if (action.actor === "owner" && txn.ownerId !== user.id) throw new ForbiddenError();
  if (action.actor === "requester" && txn.requesterId !== user.id) throw new ForbiddenError();
  if (action.actor === "moderator" && user.role !== "MODERATOR" && user.role !== "ADMIN") throw new ForbiddenError();
  if (action.actor === "system") throw new ForbiddenError();
}

function canViewTransaction(user: User, txn: { ownerId: string; requesterId: string }) {
  return txn.ownerId === user.id || txn.requesterId === user.id || user.role === "MODERATOR" || user.role === "ADMIN";
}

async function waitlistOtherRequests(tx: Prisma.TransactionClient, txn: { id: string; listingId: string }, byUserId: string) {
  const others = await tx.transaction.findMany({ where: { listingId: txn.listingId, id: { not: txn.id }, status: "PENDING" }, select: { id: true } });
  if (others.length === 0) return;
  await tx.transaction.updateMany({ where: { id: { in: others.map((row) => row.id) }, status: "PENDING" }, data: { status: "WAITLISTED" } });
  await tx.transactionEvent.createMany({ data: others.map((row) => ({ transactionId: row.id, fromStatus: "PENDING" as const, toStatus: "WAITLISTED" as const, byUserId, reason: "another_request_accepted" })) });
}

async function promoteOldestWaitlisted(tx: Prisma.TransactionClient, listingId: string, byUserId: string) {
  const next = await tx.transaction.findFirst({ where: { listingId, status: "WAITLISTED" }, orderBy: { createdAt: "asc" } });
  if (!next) return;
  await tx.transaction.update({ where: { id: next.id }, data: { status: "PENDING" } });
  await tx.transactionEvent.create({ data: { transactionId: next.id, fromStatus: "WAITLISTED", toStatus: "PENDING", byUserId, reason: "accepted_request_cancelled" } });
  await tx.notification.create({ data: { userId: next.requesterId, kind: "TRANSACTION_STATUS_CHANGED", payload: { transactionId: next.id, event: "promoted_from_waitlist" } } });
}

async function ensureTransactionConversation(tx: Prisma.TransactionClient, txn: { id: string; ownerId: string; requesterId: string }) {
  const [userAId, userBId] = [txn.ownerId, txn.requesterId].sort();
  await tx.conversation.upsert({ where: { transactionId: txn.id }, create: { userAId, userBId, transactionId: txn.id }, update: {} });
}

async function applySideEffect(tx: Prisma.TransactionClient, txn: { id: string; ownerId: string; requesterId: string; listingId: string }, effect: SideEffect, actorId: string) {
  switch (effect.kind) {
    case "listing-status":
      await tx.listing.update({ where: { id: txn.listingId }, data: { status: effect.status } }); break;
    case "reputation": {
      const userId = effect.userKey === "owner" ? txn.ownerId : txn.requesterId;
      await addReputationEvent(tx, {
        userId,
        kind: effect.delta > 0 ? "TRANSACTION_COMPLETED" : "CANCELLATION",
        delta: effect.delta,
        context: { transactionId: txn.id, reason: effect.reason },
        actorId,
      });
      break;
    }
    case "notify": {
      const userId = effect.userKey === "owner" ? txn.ownerId : txn.requesterId;
      await dispatchNotifications(tx, {
        kind: "transaction.status_changed",
        actorId,
        transactionId: txn.id,
        recipientIds: [userId],
        status: effect.event,
      });
      break;
    }
    case "schedule-reminder":
      await tx.notification.create({ data: { userId: txn.requesterId, kind: "TRANSACTION_STATUS_CHANGED", payload: { transactionId: txn.id, event: "delivery_reminder_scheduled", dueAt: new Date(Date.now() + effect.days * 86400000).toISOString() } } }); break;
  }
}

function transactionInclude() {
  return {
    listing: { include: { photos: { orderBy: { position: "asc" as const } } } },
    owner: { select: { id: true, displayName: true, reputationTier: true } }, requester: { select: { id: true, displayName: true, reputationTier: true } },
    events: { orderBy: { createdAt: "asc" as const } }, ratings: true, conversation: true,
  };
}
