// prisma/seed.ts — populate the local DB with demo data.
//
//   npm run db:seed
//
// Creates 3 users (one moderator), a couple of communities, a few listings
// and one in-flight transaction so the team can poke around the UI.

import argon2 from "argon2";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("seeding…");

  const password = await argon2.hash("Password1", { type: argon2.argon2id });

  const alice = await prisma.user.upsert({
    where: { email: "alice@bookbridge.local" },
    update: {},
    create: {
      email: "alice@bookbridge.local",
      displayName: "Alice",
      passwordHash: password,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      reputationScore: 35,
      reputationTier: "active",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@bookbridge.local" },
    update: {},
    create: {
      email: "bob@bookbridge.local",
      displayName: "Bob",
      passwordHash: password,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      reputationScore: 60,
      reputationTier: "trusted",
    },
  });

  const mod = await prisma.user.upsert({
    where: { email: "mod@bookbridge.local" },
    update: {},
    create: {
      email: "mod@bookbridge.local",
      displayName: "ModSquad",
      passwordHash: password,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      role: "MODERATOR",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@bookbridge.local" },
    update: {},
    create: {
      email: "admin@bookbridge.local",
      displayName: "BookBridge Admin",
      passwordHash: password,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      role: "ADMIN",
    },
  });

  const hust = await prisma.community.upsert({
    where: { name: "HUST" },
    update: { memberCount: 3 },
    create: { name: "HUST", scope: "UNIVERSITY", ownerId: mod.id, memberCount: 3 },
  });
  await prisma.communityMembership.upsert({
    where: { userId_communityId: { userId: mod.id, communityId: hust.id } },
    update: { role: "MODERATOR" },
    create: { userId: mod.id, communityId: hust.id, role: "MODERATOR" },
  });
  await prisma.communityMembership.upsert({
    where: { userId_communityId: { userId: alice.id, communityId: hust.id } },
    update: {},
    create: { userId: alice.id, communityId: hust.id },
  });
  await prisma.communityMembership.upsert({
    where: { userId_communityId: { userId: bob.id, communityId: hust.id } },
    update: {},
    create: { userId: bob.id, communityId: hust.id },
  });

  const listing = await prisma.listing.create({
    data: {
      ownerId: alice.id,
      title: "Sapiens",
      author: "Yuval Noah Harari",
      genre: "non-fiction",
      condition: "GOOD",
      description: "A brief history of humankind. Mild highlighter on chapter 3.",
      transactionType: "GIFT",
      communityId: hust.id,
      photos: { create: [{ url: "https://example.com/sapiens.jpg" }] },
    },
  });

  await prisma.transaction.create({
    data: {
      listingId: listing.id,
      ownerId: alice.id,
      requesterId: bob.id,
      type: "GIFT",
      status: "PENDING",
    },
  });

  await prisma.notification.create({
    data: {
      userId: admin.id,
      kind: "COMMUNITY_ANNOUNCEMENT",
      payload: { event: "seed.completed", communityId: hust.id },
    },
  });

  console.log("seeded:", { alice: alice.id, bob: bob.id, mod: mod.id, admin: admin.id, listing: listing.id });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
