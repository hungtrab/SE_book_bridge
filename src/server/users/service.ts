import { z } from "zod";
import argon2 from "argon2";
import crypto from "node:crypto";

import { NotFoundError } from "../lib/errors";
import { prisma } from "../lib/prisma";

export const ProfileUpdateSchema = z.object({
  displayName: z.string().min(2).max(64).optional(),
  avatarUrl: z.string().url().max(500).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  preferredGenres: z.array(z.string().min(1).max(64)).max(20).optional(),
  locationDistrict: z.string().max(120).nullable().optional(),
});

export async function updateMyProfile(
  userId: string,
  input: z.infer<typeof ProfileUpdateSchema>,
) {
  const data = ProfileUpdateSchema.parse(input);
  return prisma.user.update({
    where: { id: userId },
    data,
    select: userSelect,
  });
}

export async function getPublicProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      preferredGenres: true,
      locationDistrict: true,
      reputationScore: true,
      reputationTier: true,
      followerCount: true,
      followingCount: true,
      createdAt: true,
      listings: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          title: true,
          author: true,
          genre: true,
          condition: true,
          transactionType: true,
          askingPriceVnd: true,
          createdAt: true,
        },
      },
    },
  });
  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function listPublicUserListings(userId: string, cursor?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new NotFoundError("User not found");
  const rows = await prisma.listing.findMany({
    where: { ownerId: userId, status: "ACTIVE" },
    include: { photos: { take: 1, orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: 21,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
  });
  return { items: rows.slice(0, 20), nextCursor: rows.length > 20 ? rows[20].id : null };
}

export async function deleteMyAccount(userId: string) {
  const deletedEmail = `deleted-${userId}@deleted.bookbridge.local`;
  const passwordHash = await argon2.hash(crypto.randomBytes(32).toString("hex"), {
    type: argon2.argon2id,
  });

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        email: deletedEmail,
        passwordHash,
        displayName: "Deleted user",
        avatarUrl: null,
        bio: null,
        preferredGenres: [],
        locationDistrict: null,
        status: "DELETED",
      },
      select: userSelect,
    });
    await tx.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return user;
  });
}

export const userSelect = {
  id: true,
  email: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  preferredGenres: true,
  locationDistrict: true,
  role: true,
  status: true,
  reputationScore: true,
  reputationTier: true,
  followerCount: true,
  followingCount: true,
  createdAt: true,
} as const;
