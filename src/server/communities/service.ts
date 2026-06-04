import type { User } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { ConflictError, ForbiddenError, NotFoundError } from "../lib/errors";
import { fanoutExistingListingsToUser } from "../feed/fanout";

export const MAX_COMMUNITIES_PER_USER = 20;

export const CommunityCreateSchema = z.object({
  name: z.string().trim().min(2).max(64),
  scope: z.enum(["UNIVERSITY", "LOCATION", "GENRE"]),
  description: z.string().trim().max(500).optional(),
});

export const CommunityQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  scope: z.enum(["UNIVERSITY", "LOCATION", "GENRE"]).optional(),
});

export function canJoinCommunity(currentCount: number): boolean {
  return currentCount < MAX_COMMUNITIES_PER_USER;
}

export async function listCommunities(input: z.infer<typeof CommunityQuerySchema>, userId?: string) {
  const data = CommunityQuerySchema.parse(input);
  return prisma.community.findMany({
    where: {
      ...(data.scope ? { scope: data.scope } : {}),
      ...(data.q
        ? {
            OR: [
              { name: { contains: data.q, mode: "insensitive" } },
              { description: { contains: data.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: userId
      ? { memberships: { where: { userId }, select: { role: true } } }
      : undefined,
    orderBy: [{ memberCount: "desc" }, { name: "asc" }],
    take: 100,
  });
}

export async function getCommunity(id: string, userId?: string) {
  const community = await prisma.community.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, displayName: true } },
      memberships: {
        take: 50,
        orderBy: { joinedAt: "asc" },
        include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
      },
      listings: {
        where: { status: "ACTIVE" },
        take: 20,
        orderBy: { createdAt: "desc" },
        include: { photos: { take: 1, orderBy: { position: "asc" } } },
      },
    },
  });
  if (!community) throw new NotFoundError("Community not found");
  return {
    ...community,
    myMembership: userId
      ? community.memberships.find((membership) => membership.userId === userId) ?? null
      : null,
  };
}

export async function createCommunity(user: User, input: z.infer<typeof CommunityCreateSchema>) {
  const data = CommunityCreateSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const count = await tx.communityMembership.count({ where: { userId: user.id } });
    if (!canJoinCommunity(count)) throw new ConflictError("You can join at most 20 communities");
    const existing = await tx.community.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictError("A community with this name already exists");

    return tx.community.create({
      data: {
        ownerId: user.id,
        name: data.name,
        scope: data.scope,
        description: data.description,
        memberCount: 1,
        memberships: { create: { userId: user.id, role: "MODERATOR" } },
      },
    });
  });
}

export async function joinCommunity(userId: string, communityId: string) {
  return prisma.$transaction(async (tx) => {
    const community = await tx.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundError("Community not found");
    const existing = await tx.communityMembership.findUnique({
      where: { userId_communityId: { userId, communityId } },
    });
    if (existing) return { joined: true };
    const count = await tx.communityMembership.count({ where: { userId } });
    if (!canJoinCommunity(count)) throw new ConflictError("You can join at most 20 communities");
    await tx.communityMembership.create({ data: { userId, communityId } });
    await tx.community.update({ where: { id: communityId }, data: { memberCount: { increment: 1 } } });
    await fanoutExistingListingsToUser(tx, userId, { communityId });
    return { joined: true };
  });
}

export async function leaveCommunity(userId: string, communityId: string) {
  return prisma.$transaction(async (tx) => {
    const community = await tx.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundError("Community not found");
    if (community.ownerId === userId) throw new ForbiddenError("Community owner cannot leave");
    const deleted = await tx.communityMembership.deleteMany({ where: { userId, communityId } });
    if (deleted.count > 0) {
      await tx.community.update({
        where: { id: communityId },
        data: { memberCount: { decrement: 1 } },
      });
    }
    return { joined: false };
  });
}
