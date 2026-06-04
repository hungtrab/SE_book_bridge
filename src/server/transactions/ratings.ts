import type { User } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../lib/errors";
import { addReputationEvent } from "../reputation/service";
import { deltaForRating } from "../reputation/scoring";

export const RatingSchema = z.object({ stars: z.number().int().min(1).max(5), comment: z.string().trim().max(1000).optional() });

export async function rateTransaction(user: User, transactionId: string, input: z.infer<typeof RatingSchema>) {
  const data = RatingSchema.parse(input);
  const txn = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!txn) throw new NotFoundError("Transaction not found");
  if (txn.status !== "COMPLETED") throw new BadRequestError("Can only rate a completed transaction");
  if (user.id !== txn.ownerId && user.id !== txn.requesterId) throw new ForbiddenError();
  const toUserId = user.id === txn.ownerId ? txn.requesterId : txn.ownerId;
  const existing = await prisma.rating.findUnique({ where: { transactionId_fromUserId: { transactionId, fromUserId: user.id } } });
  if (existing) throw new ConflictError("You already rated this transaction");
  const delta = ratingDelta(data.stars);
  return prisma.$transaction(async (tx) => {
    const rating = await tx.rating.create({ data: { transactionId, fromUserId: user.id, toUserId, stars: data.stars, comment: data.comment } });
    await addReputationEvent(tx, {
      userId: toUserId,
      kind: "RATING_RECEIVED",
      delta,
      context: { transactionId, ratingId: rating.id, stars: data.stars },
      actorId: user.id,
    });
    return rating;
  });
}
export function ratingDelta(stars: number): number {
  return stars >= 1 && stars <= 5 ? deltaForRating(stars as 1 | 2 | 3 | 4 | 5) : 0;
}
