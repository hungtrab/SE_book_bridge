import { z } from "zod";

import { prisma } from "../lib/prisma";
import { BadRequestError, NotFoundError } from "../lib/errors";
import { fanoutExistingListingsToUser } from "../feed/fanout";

export const FollowSchema = z.object({ userId: z.string().min(1) });

export async function followUser(followerId: string, followeeId: string) {
  if (followerId === followeeId) throw new BadRequestError("You cannot follow yourself");
  return prisma.$transaction(async (tx) => {
    const followee = await tx.user.findFirst({
      where: { id: followeeId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!followee) throw new NotFoundError("User not found");
    const created = await tx.follow.createMany({ data: [{ followerId, followeeId }], skipDuplicates: true });
    if (created.count === 0) return { following: true };
    await Promise.all([
      tx.user.update({ where: { id: followerId }, data: { followingCount: { increment: 1 } } }),
      tx.user.update({ where: { id: followeeId }, data: { followerCount: { increment: 1 } } }),
      fanoutExistingListingsToUser(tx, followerId, { followeeId }),
    ]);
    return { following: true };
  });
}

export async function unfollowUser(followerId: string, followeeId: string) {
  return prisma.$transaction(async (tx) => {
    const deleted = await tx.follow.deleteMany({ where: { followerId, followeeId } });
    if (deleted.count > 0) {
      await Promise.all([
        tx.user.update({ where: { id: followerId }, data: { followingCount: { decrement: 1 } } }),
        tx.user.update({ where: { id: followeeId }, data: { followerCount: { decrement: 1 } } }),
      ]);
    }
    return { following: false };
  });
}

const PROFILE_SUMMARY_SELECT = {
  id: true,
  displayName: true,
  avatarUrl: true,
  reputationScore: true,
  reputationTier: true,
} as const;

export async function listFollowers(userId: string) {
  const user = await prisma.user.findFirst({ where: { id: userId, status: "ACTIVE" }, select: { id: true } });
  if (!user) throw new NotFoundError("User not found");
  const rows = await prisma.follow.findMany({
    where: { followeeId: userId },
    include: { follower: { select: PROFILE_SUMMARY_SELECT } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => row.follower);
}

export async function listFollowing(userId: string) {
  const user = await prisma.user.findFirst({ where: { id: userId, status: "ACTIVE" }, select: { id: true } });
  if (!user) throw new NotFoundError("User not found");
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    include: { followee: { select: PROFILE_SUMMARY_SELECT } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => row.followee);
}

export async function getFollowState(viewerId: string | undefined, userId: string) {
  const [counts, relation] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { followerCount: true, followingCount: true },
    }),
    viewerId && viewerId !== userId
      ? prisma.follow.findUnique({ where: { followerId_followeeId: { followerId: viewerId, followeeId: userId } } })
      : null,
  ]);
  if (!counts) throw new NotFoundError("User not found");
  return { ...counts, following: Boolean(relation) };
}
