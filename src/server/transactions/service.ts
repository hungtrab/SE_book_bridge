// transactions service — wires the state machine to Prisma.

import { z } from "zod";
import type { User } from "@prisma/client";

import { prisma } from "../lib/prisma";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../lib/errors";

import {
  transition,
  type TxnAction,
  type SideEffect,
} from "./state-machine";


export const RequestSchema = z.object({
  listingId: z.string().min(1),
});

export async function requestListing(user: User, input: z.infer<typeof RequestSchema>) {
  const data = RequestSchema.parse(input);
  const listing = await prisma.listing.findUnique({ where: { id: data.listingId } });
  if (!listing) throw new NotFoundError("Listing not found");
  if (listing.status !== "ACTIVE")
    throw new BadRequestError(`Listing is ${listing.status}, not available`);
  if (listing.ownerId === user.id)
    throw new BadRequestError("You cannot request your own listing");

  return prisma.transaction.create({
    data: {
      listingId: listing.id,
      ownerId: listing.ownerId,
      requesterId: user.id,
      type: listing.transactionType,
      status: "PENDING",
      events: { create: [{ toStatus: "PENDING", byUserId: user.id }] },
    },
  });
}

export async function applyAction(user: User, txnId: string, action: TxnAction) {
  const txn = await prisma.transaction.findUnique({ where: { id: txnId } });
  if (!txn) throw new NotFoundError("Transaction not found");

  // Decide who the actor is based on user id vs txn parties.
  const isOwner = txn.ownerId === user.id;
  const isRequester = txn.requesterId === user.id;
  const declared = action.actor;
  const isMod = user.role === "MODERATOR" || user.role === "ADMIN";

  // Match the actor that the route claims with what we know about this user.
  if (declared === "owner" && !isOwner) throw new ForbiddenError();
  if (declared === "requester" && !isRequester) throw new ForbiddenError();
  if (declared === "moderator" && !isMod) throw new ForbiddenError();

  const result = transition(txn.status, action);
  if (!result.ok) throw new BadRequestError(result.reason);

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: txn.id },
      data: { status: result.next,
              events: { create: [{ fromStatus: txn.status,
                                   toStatus: result.next,
                                   byUserId: user.id }] } },
    });

    for (const eff of result.sideEffects) {
      await applySideEffect(tx, txn, eff);
    }
  });

  return { status: result.next };
}

async function applySideEffect(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  txn: { id: string; ownerId: string; requesterId: string; listingId: string },
  eff: SideEffect,
) {
  switch (eff.kind) {
    case "listing-status":
      await tx.listing.update({
        where: { id: txn.listingId },
        data: { status: eff.status },
      });
      break;
    case "reputation": {
      const userId = eff.userKey === "owner" ? txn.ownerId : txn.requesterId;
      await tx.reputationEvent.create({
        data: {
          userId,
          kind: eff.delta > 0 ? "TRANSACTION_COMPLETED" : "CANCELLATION",
          delta: eff.delta,
          context: { transactionId: txn.id, reason: eff.reason },
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { reputationScore: { increment: eff.delta } },
      });
      break;
    }
    case "notify": {
      const userId = eff.userKey === "owner" ? txn.ownerId : txn.requesterId;
      await tx.notification.create({
        data: {
          userId,
          kind: "TRANSACTION_STATUS_CHANGED",
          payload: { transactionId: txn.id, event: eff.event },
        },
      });
      break;
    }
    case "schedule-reminder":
      // The actual cron job is owned by Person 6 (server/notifications/dispatcher).
      // For now we just record the intent in a Notification with a future
      // due-by field; a separate worker picks it up.
      // (Stub — implement in cron sprint.)
      break;
  }
}
