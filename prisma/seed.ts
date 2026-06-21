// prisma/seed.ts — populate the local DB with demo data.
//
//   npm run db:seed
//
// Demo logins all use: Password1

import bcrypt from "bcryptjs";

import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Password1";
const DEMO_EMAILS = [
  "alice@bookbridge.local",
  "bob@bookbridge.local",
  "clara@bookbridge.local",
  "duy@bookbridge.local",
  "mod@bookbridge.local",
  "admin@bookbridge.local",
  "mai@bookbridge.local",
  "nam@bookbridge.local",
  "linh@bookbridge.local",
  "quang@bookbridge.local",
  "yen@bookbridge.local",
  "minh@bookbridge.local",
];

const COMMUNITIES = [
  { name: "HUST", scope: "UNIVERSITY" as const, description: "Hanoi University of Science and Technology readers." },
  { name: "FTU Readers", scope: "UNIVERSITY" as const, description: "Foreign Trade University book exchange." },
  { name: "Cau Giay Book Swap", scope: "LOCATION" as const, description: "District-level sharing around Cau Giay." },
  { name: "Non-fiction Vietnam", scope: "GENRE" as const, description: "History, economics, memoirs and essays." },
  { name: "Software Textbooks", scope: "GENRE" as const, description: "CS, software engineering and programming books." },
  { name: "Book News & Discoveries", scope: "GENRE" as const, description: "Daily source-attributed book news, trending titles and reading discoveries." },
  { name: "Vietnamese Literature", scope: "GENRE" as const, description: "Vietnamese novels, poetry, essays and literary discussion." },
  { name: "Language Learners", scope: "GENRE" as const, description: "Books and study groups for English, Vietnamese, Japanese and other languages." },
];

const LISTINGS = [
  {
    owner: "alice@bookbridge.local",
    community: "HUST",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    isbn: "9780062316097",
    genre: "non-fiction",
    condition: "GOOD" as const,
    description: "A brief history of humankind. Mild highlighter on chapter 3.",
    transactionType: "GIFT" as const,
  },
  {
    owner: "bob@bookbridge.local",
    community: "Non-fiction Vietnam",
    title: "Homo Deus",
    author: "Yuval Noah Harari",
    isbn: "9780062464316",
    genre: "non-fiction",
    condition: "LIKE_NEW" as const,
    description: "Future-facing non-fiction, clean copy with no notes.",
    transactionType: "EXCHANGE" as const,
  },
  {
    owner: "alice@bookbridge.local",
    community: "Software Textbooks",
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    genre: "software",
    condition: "GOOD" as const,
    description: "Classic software craftsmanship book. Cover has small crease.",
    transactionType: "SELL" as const,
    askingPriceVnd: 45000,
  },
  {
    owner: "clara@bookbridge.local",
    community: "Software Textbooks",
    title: "Designing Data-Intensive Applications",
    author: "Martin Kleppmann",
    isbn: "9781449373320",
    genre: "software",
    condition: "LIKE_NEW" as const,
    description: "Distributed systems book, useful for search/feed architecture defense.",
    transactionType: "EXCHANGE" as const,
  },
  {
    owner: "duy@bookbridge.local",
    community: "Cau Giay Book Swap",
    title: "Atomic Habits",
    author: "James Clear",
    isbn: "9780735211292",
    genre: "self-help",
    condition: "GOOD" as const,
    description: "Practical habits book, Vietnamese sticky notes removed.",
    transactionType: "GIFT" as const,
  },
  {
    owner: "bob@bookbridge.local",
    community: "FTU Readers",
    title: "The Lean Startup",
    author: "Eric Ries",
    genre: "business",
    condition: "FAIR" as const,
    description: "Readable business book with annotations in pencil.",
    transactionType: "SELL" as const,
    askingPriceVnd: 30000,
  },
  {
    owner: "clara@bookbridge.local",
    community: "FTU Readers",
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    genre: "psychology",
    condition: "GOOD" as const,
    description: "Behavioral economics classic, a few dog-eared pages.",
    transactionType: "EXCHANGE" as const,
  },
  {
    owner: "duy@bookbridge.local",
    community: "HUST",
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    genre: "software",
    condition: "FAIR" as const,
    description: "Heavy textbook for algorithms. Older edition but complete.",
    transactionType: "GIFT" as const,
  },
  {
    owner: "alice@bookbridge.local",
    community: "Non-fiction Vietnam",
    title: "Educated",
    author: "Tara Westover",
    genre: "memoir",
    condition: "NEW" as const,
    description: "Unread paperback copy of the memoir Educated.",
    transactionType: "SELL" as const,
    askingPriceVnd: 50000,
  },
  {
    owner: "bob@bookbridge.local",
    community: "Cau Giay Book Swap",
    title: "Norwegian Wood",
    author: "Haruki Murakami",
    genre: "fiction",
    condition: "GOOD" as const,
    description: "Fiction paperback, good for casual exchange in the district.",
    transactionType: "EXCHANGE" as const,
  },
  {
    owner: "mai@bookbridge.local", community: "Vietnamese Literature", title: "The Mountains Sing", author: "Nguyen Phan Que Mai",
    isbn: "9781643751351", genre: "fiction", condition: "LIKE_NEW" as const,
    description: "A multigenerational Vietnamese family story in excellent condition.", transactionType: "EXCHANGE" as const,
  },
  {
    owner: "nam@bookbridge.local", community: "Software Textbooks", title: "The Pragmatic Programmer", author: "David Thomas and Andrew Hunt",
    isbn: "9780135957059", genre: "software", condition: "GOOD" as const,
    description: "Twentieth anniversary edition with light pencil notes in two chapters.", transactionType: "SELL" as const, askingPriceVnd: 50000,
  },
  {
    owner: "linh@bookbridge.local", community: "Language Learners", title: "English Grammar in Use", author: "Raymond Murphy",
    isbn: "9781108457651", genre: "language", condition: "GOOD" as const,
    description: "Intermediate grammar reference with most exercises left blank.", transactionType: "GIFT" as const,
  },
  {
    owner: "quang@bookbridge.local", community: "Non-fiction Vietnam", title: "Factfulness", author: "Hans Rosling",
    isbn: "9781250107817", genre: "non-fiction", condition: "LIKE_NEW" as const,
    description: "Clean paperback about understanding global trends using data.", transactionType: "EXCHANGE" as const,
  },
  {
    owner: "yen@bookbridge.local", community: "Cau Giay Book Swap", title: "Before the Coffee Gets Cold", author: "Toshikazu Kawaguchi",
    isbn: "9781335430991", genre: "fiction", condition: "GOOD" as const,
    description: "Short reflective novel, easy to carry for an in-person swap.", transactionType: "GIFT" as const,
  },
  {
    owner: "minh@bookbridge.local", community: "Software Textbooks", title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell and Peter Norvig",
    isbn: "9780134610993", genre: "ai", condition: "FAIR" as const,
    description: "Large AI textbook with worn corners but complete pages and diagrams.", transactionType: "SELL" as const, askingPriceVnd: 50000,
  },
  {
    owner: "mai@bookbridge.local", community: "FTU Readers", title: "The Psychology of Money", author: "Morgan Housel",
    isbn: "9780857197689", genre: "psychology", condition: "NEW" as const,
    description: "Unread copy about behavior, wealth and long-term financial decisions.", transactionType: "SELL" as const, askingPriceVnd: 45000,
  },
  {
    owner: "nam@bookbridge.local", community: "HUST", title: "Concrete Mathematics", author: "Ronald Graham, Donald Knuth and Oren Patashnik",
    isbn: "9780201558029", genre: "math", condition: "FAIR" as const,
    description: "A challenging mathematics text for computer science students.", transactionType: "GIFT" as const,
  },
  {
    owner: "linh@bookbridge.local", community: "Vietnamese Literature", title: "The Sorrow of War", author: "Bao Ninh",
    isbn: "9781573225434", genre: "fiction", condition: "GOOD" as const,
    description: "English translation in good condition with a protected cover.", transactionType: "EXCHANGE" as const,
  },
  {
    owner: "quang@bookbridge.local", community: "Software Textbooks", title: "Grokking Algorithms", author: "Aditya Bhargava",
    isbn: "9781617292231", genre: "computer-science", condition: "LIKE_NEW" as const,
    description: "Friendly illustrated introduction to algorithms and data structures.", transactionType: "GIFT" as const,
  },
  {
    owner: "yen@bookbridge.local", community: "Language Learners", title: "Japanese From Zero! 1", author: "George Trombley",
    isbn: "9780976998129", genre: "language", condition: "GOOD" as const,
    description: "Beginner Japanese workbook with only the first unit completed.", transactionType: "EXCHANGE" as const,
  },
  {
    owner: "minh@bookbridge.local", community: "Non-fiction Vietnam", title: "The Gene", author: "Siddhartha Mukherjee",
    isbn: "9781476733524", genre: "science", condition: "GOOD" as const,
    description: "A detailed history of genetics with several useful sticky tabs.", transactionType: "SELL" as const, askingPriceVnd: 40000,
  },
  {
    owner: "mai@bookbridge.local", community: "Book News & Discoveries", title: "Tomorrow, and Tomorrow, and Tomorrow", author: "Gabrielle Zevin",
    isbn: "9780593321201", genre: "fiction", condition: "LIKE_NEW" as const,
    description: "Contemporary novel about friendship, creativity and game development.", transactionType: "EXCHANGE" as const,
  },
  {
    owner: "nam@bookbridge.local", community: "HUST", title: "Operating System Concepts", author: "Abraham Silberschatz",
    isbn: "9781119800361", genre: "computer-science", condition: "GOOD" as const,
    description: "Operating systems textbook suitable for university coursework.", transactionType: "SELL" as const, askingPriceVnd: 50000,
  },
];

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.SEED_ALLOW_PRODUCTION !== "YES_I_UNDERSTAND") {
    throw new Error("Production seed blocked. Set SEED_ALLOW_PRODUCTION=YES_I_UNDERSTAND after taking a database backup.");
  }
  console.log("seeding...");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const users = await seedUsers(passwordHash);
  const communities = await seedCommunities(users.mod.id);
  await seedMemberships(users, communities);
  await cleanupKnownDemoRows();
  await prisma.communityPostComment.deleteMany({
    where: { post: { kind: "MEMBER", author: { email: { in: DEMO_EMAILS } } } },
  });
  await prisma.communityPostLike.deleteMany({
    where: { post: { kind: "MEMBER", author: { email: { in: DEMO_EMAILS } } } },
  });
  await prisma.communityPost.deleteMany({
    where: { kind: "MEMBER", author: { email: { in: DEMO_EMAILS } } },
  });
  const listings = await seedListings(users, communities);
  await seedFollows(users);
  await syncFollowCounters();
  await seedFeedItems(listings);
  await seedTransactions(users, listings);
  await seedReports(users, listings);
  await seedMarketplaceEngagement(users, listings);
  await seedArtifactComments(users);
  await seedCommunityPosts(users, communities, listings);
  await seedNotifications(users, communities);

  console.log("seeded:", {
    users: Object.fromEntries(Object.entries(users).map(([key, user]) => [key, user.id])),
    communities: communities.map((community) => community.name),
    listings: listings.length,
  });
}

async function seedUsers(passwordHash: string) {
  const alice = await upsertUser({
    email: "alice@bookbridge.local",
    displayName: "Alice Nguyen",
    passwordHash,
    reputationScore: 35,
    reputationTier: "active",
    locationDistrict: "Cau Giay",
    preferredGenres: ["non-fiction", "software"],
  });
  const bob = await upsertUser({
    email: "bob@bookbridge.local",
    displayName: "Bob Tran",
    passwordHash,
    reputationScore: 60,
    reputationTier: "trusted",
    locationDistrict: "Dong Da",
    preferredGenres: ["business", "fiction"],
  });
  const clara = await upsertUser({
    email: "clara@bookbridge.local",
    displayName: "Clara Pham",
    passwordHash,
    reputationScore: 82,
    reputationTier: "champion",
    locationDistrict: "Ba Dinh",
    preferredGenres: ["psychology", "software"],
  });
  const duy = await upsertUser({
    email: "duy@bookbridge.local",
    displayName: "Duy Le",
    passwordHash,
    reputationScore: 12,
    reputationTier: "new",
    locationDistrict: "Cau Giay",
    preferredGenres: ["self-help", "fiction"],
  });
  const mod = await upsertUser({
    email: "mod@bookbridge.local",
    displayName: "Community Moderator",
    passwordHash,
    role: "MODERATOR",
    reputationScore: 55,
    reputationTier: "trusted",
    locationDistrict: "Hai Ba Trung",
  });
  const admin = await upsertUser({
    email: "admin@bookbridge.local",
    displayName: "BookBridge Admin",
    passwordHash,
    role: "ADMIN",
    reputationScore: 90,
    reputationTier: "champion",
    locationDistrict: "Hoan Kiem",
  });
  const mai = await upsertUser({
    email: "mai@bookbridge.local", displayName: "Mai Hoang", passwordHash,
    reputationScore: 28, reputationTier: "active", locationDistrict: "Thanh Xuan",
    preferredGenres: ["fiction", "psychology"],
  });
  const nam = await upsertUser({
    email: "nam@bookbridge.local", displayName: "Nam Pham", passwordHash,
    reputationScore: 47, reputationTier: "active", locationDistrict: "Hai Ba Trung",
    preferredGenres: ["software", "math"],
  });
  const linh = await upsertUser({
    email: "linh@bookbridge.local", displayName: "Linh Do", passwordHash,
    reputationScore: 71, reputationTier: "trusted", locationDistrict: "Ba Dinh",
    preferredGenres: ["language", "fiction"],
  });
  const quang = await upsertUser({
    email: "quang@bookbridge.local", displayName: "Quang Vu", passwordHash,
    reputationScore: 18, reputationTier: "new", locationDistrict: "Dong Da",
    preferredGenres: ["science", "computer-science"],
  });
  const yen = await upsertUser({
    email: "yen@bookbridge.local", displayName: "Yen Bui", passwordHash,
    reputationScore: 52, reputationTier: "trusted", locationDistrict: "Cau Giay",
    preferredGenres: ["fiction", "language"],
  });
  const minh = await upsertUser({
    email: "minh@bookbridge.local", displayName: "Minh Nguyen", passwordHash,
    reputationScore: 84, reputationTier: "champion", locationDistrict: "Hoan Kiem",
    preferredGenres: ["ai", "science"],
  });
  return { alice, bob, clara, duy, mod, admin, mai, nam, linh, quang, yen, minh };
}

async function upsertUser(data: Prisma.UserUncheckedCreateInput) {
  return prisma.user.upsert({
    where: { email: data.email },
    update: {
      displayName: data.displayName,
      passwordHash: data.passwordHash,
      role: data.role,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      reputationScore: data.reputationScore,
      reputationTier: data.reputationTier,
      locationDistrict: data.locationDistrict,
      preferredGenres: data.preferredGenres,
    },
    create: {
      ...data,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });
}

async function seedCommunities(ownerId: string) {
  const rows = [];
  for (const community of COMMUNITIES) {
    rows.push(await prisma.community.upsert({
      where: { name: community.name },
      update: { scope: community.scope, description: community.description, ownerId },
      create: { ...community, ownerId, memberCount: 0 },
    }));
  }
  return rows;
}

async function seedMemberships(
  users: Awaited<ReturnType<typeof seedUsers>>,
  communities: Awaited<ReturnType<typeof seedCommunities>>,
) {
  const byName = new Map(communities.map((community) => [community.name, community]));
  const memberships = [
    [users.mod.id, "HUST", "MODERATOR"],
    [users.alice.id, "HUST", "MEMBER"],
    [users.bob.id, "HUST", "MEMBER"],
    [users.duy.id, "HUST", "MEMBER"],
    [users.nam.id, "HUST", "MEMBER"],
    [users.clara.id, "FTU Readers", "MEMBER"],
    [users.bob.id, "FTU Readers", "MEMBER"],
    [users.mai.id, "FTU Readers", "MEMBER"],
    [users.alice.id, "Non-fiction Vietnam", "MEMBER"],
    [users.bob.id, "Non-fiction Vietnam", "MEMBER"],
    [users.clara.id, "Software Textbooks", "MEMBER"],
    [users.alice.id, "Software Textbooks", "MEMBER"],
    [users.duy.id, "Cau Giay Book Swap", "MEMBER"],
    [users.bob.id, "Cau Giay Book Swap", "MEMBER"],
    [users.admin.id, "Book News & Discoveries", "MODERATOR"],
    [users.mai.id, "Book News & Discoveries", "MEMBER"],
    [users.minh.id, "Book News & Discoveries", "MEMBER"],
    [users.mai.id, "Vietnamese Literature", "MEMBER"],
    [users.linh.id, "Vietnamese Literature", "MEMBER"],
    [users.linh.id, "Language Learners", "MODERATOR"],
    [users.yen.id, "Language Learners", "MEMBER"],
    [users.nam.id, "Software Textbooks", "MEMBER"],
    [users.minh.id, "Software Textbooks", "MEMBER"],
    [users.quang.id, "Software Textbooks", "MEMBER"],
    [users.quang.id, "Non-fiction Vietnam", "MEMBER"],
    [users.yen.id, "Cau Giay Book Swap", "MEMBER"],
  ] as const;
  for (const [userId, communityName, role] of memberships) {
    const community = byName.get(communityName)!;
    await prisma.communityMembership.upsert({
      where: { userId_communityId: { userId, communityId: community.id } },
      update: { role },
      create: { userId, communityId: community.id, role },
    });
  }
  for (const community of communities) {
    const memberCount = await prisma.communityMembership.count({ where: { communityId: community.id } });
    await prisma.community.update({ where: { id: community.id }, data: { memberCount } });
  }
}

async function cleanupKnownDemoRows() {
  await prisma.notification.deleteMany({ where: { user: { email: { in: DEMO_EMAILS } } } });
  await prisma.listing.deleteMany({ where: { title: { in: LISTINGS.map((listing) => listing.title) } } });
  await prisma.report.deleteMany({ where: { reason: "Demo report" } });
}

async function seedListings(
  users: Awaited<ReturnType<typeof seedUsers>>,
  communities: Awaited<ReturnType<typeof seedCommunities>>,
) {
  const usersByEmail = new Map(Object.values(users).map((user) => [user.email, user]));
  const communitiesByName = new Map(communities.map((community) => [community.name, community]));
  const rows = [];
  for (const listing of LISTINGS) {
    const owner = usersByEmail.get(listing.owner)!;
    const community = communitiesByName.get(listing.community)!;
    rows.push(await prisma.listing.create({
      data: {
        ownerId: owner.id,
        communityId: community.id,
        title: listing.title,
        author: listing.author,
        isbn: listing.isbn,
        genre: listing.genre,
        condition: listing.condition,
        description: listing.description,
        transactionType: listing.transactionType,
        askingPriceVnd: "askingPriceVnd" in listing ? listing.askingPriceVnd : undefined,
        photos: { create: [{ url: `https://picsum.photos/seed/${encodeURIComponent(listing.title)}/640/480` }] },
      },
    }));
  }
  return rows;
}

async function seedFollows(users: Awaited<ReturnType<typeof seedUsers>>) {
  await prisma.follow.deleteMany({
    where: {
      OR: [
        { follower: { email: { in: DEMO_EMAILS } } },
        { followee: { email: { in: DEMO_EMAILS } } },
      ],
    },
  });
  await prisma.follow.createMany({
    data: [
      { followerId: users.bob.id, followeeId: users.alice.id },
      { followerId: users.alice.id, followeeId: users.bob.id },
      { followerId: users.duy.id, followeeId: users.alice.id },
      { followerId: users.alice.id, followeeId: users.clara.id },
      { followerId: users.clara.id, followeeId: users.bob.id },
      { followerId: users.bob.id, followeeId: users.duy.id },
      { followerId: users.mai.id, followeeId: users.linh.id },
      { followerId: users.mai.id, followeeId: users.clara.id },
      { followerId: users.nam.id, followeeId: users.minh.id },
      { followerId: users.linh.id, followeeId: users.mai.id },
      { followerId: users.quang.id, followeeId: users.nam.id },
      { followerId: users.yen.id, followeeId: users.mai.id },
      { followerId: users.minh.id, followeeId: users.quang.id },
    ],
    skipDuplicates: true,
  });
}

async function syncFollowCounters() {
  const users = await prisma.user.findMany({ where: { email: { in: DEMO_EMAILS } }, select: { id: true } });
  for (const user of users) {
    const [followerCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followeeId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
    ]);
    await prisma.user.update({ where: { id: user.id }, data: { followerCount, followingCount } });
  }
}

async function seedFeedItems(listings: Awaited<ReturnType<typeof seedListings>>) {
  await prisma.feedItem.deleteMany({ where: { listingId: { in: listings.map((listing) => listing.id) } } });
  const memberships = await prisma.communityMembership.findMany({ select: { userId: true, communityId: true } });
  const follows = await prisma.follow.findMany({ select: { followerId: true, followeeId: true } });
  const feedItems: Prisma.FeedItemCreateManyInput[] = [];
  for (const listing of listings) {
    const recipients = new Map<string, string[]>();
    for (const follow of follows) {
      if (follow.followeeId === listing.ownerId && follow.followerId !== listing.ownerId) addReason(recipients, follow.followerId, "followed_owner");
    }
    for (const membership of memberships) {
      if (membership.communityId === listing.communityId && membership.userId !== listing.ownerId) addReason(recipients, membership.userId, "community");
    }
    for (const [userId, reasons] of recipients) {
      feedItems.push({
        userId,
        listingId: listing.id,
        kind: "new_listing",
        payload: { event: "listing.created", listingId: listing.id, title: listing.title, ownerId: listing.ownerId, reasons },
        createdAt: listing.createdAt,
      });
    }
  }
  if (feedItems.length > 0) await prisma.feedItem.createMany({ data: feedItems, skipDuplicates: true });
}

async function seedTransactions(
  users: Awaited<ReturnType<typeof seedUsers>>,
  listings: Awaited<ReturnType<typeof seedListings>>,
) {
  const sapiens = listings.find((listing) => listing.title === "Sapiens")!;
  const cleanCode = listings.find((listing) => listing.title === "Clean Code")!;
  await prisma.transaction.create({
    data: {
      listingId: sapiens.id,
      ownerId: users.alice.id,
      requesterId: users.bob.id,
      type: "GIFT",
      status: "PENDING",
      events: { create: [{ toStatus: "PENDING", byUserId: users.bob.id, reason: "demo_request" }] },
    },
  });
  await prisma.transaction.create({
    data: {
      listingId: cleanCode.id,
      ownerId: users.alice.id,
      requesterId: users.clara.id,
      type: "SELL",
      agreedPriceVnd: 45000,
      status: "IN_DELIVERY",
      acceptedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      shippedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      deliveryMethod: "POSTAL",
      trackingNumber: "DEMO123456",
      events: {
        create: [
          { toStatus: "PENDING", byUserId: users.clara.id, reason: "demo_request" },
          { fromStatus: "PENDING", toStatus: "ACCEPTED", byUserId: users.alice.id },
          { fromStatus: "ACCEPTED", toStatus: "IN_DELIVERY", byUserId: users.alice.id },
        ],
      },
    },
  });
  await prisma.listing.update({ where: { id: cleanCode.id }, data: { status: "RESERVED" } });

  const atomicHabits = listings.find((listing) => listing.title === "Atomic Habits")!;
  const pragmatic = listings.find((listing) => listing.title === "The Pragmatic Programmer")!;
  const factfulness = listings.find((listing) => listing.title === "Factfulness")!;
  const mountains = listings.find((listing) => listing.title === "The Mountains Sing")!;

  const completed = await prisma.transaction.create({
    data: {
      listingId: atomicHabits.id,
      ownerId: users.duy.id,
      requesterId: users.yen.id,
      type: "GIFT",
      status: "COMPLETED",
      acceptedAt: new Date(Date.now() - 12 * 86400000),
      shippedAt: new Date(Date.now() - 10 * 86400000),
      completedAt: new Date(Date.now() - 8 * 86400000),
      deliveryMethod: "IN_PERSON",
      events: {
        create: [
          { toStatus: "PENDING", byUserId: users.yen.id },
          { fromStatus: "PENDING", toStatus: "ACCEPTED", byUserId: users.duy.id },
          { fromStatus: "ACCEPTED", toStatus: "IN_DELIVERY", byUserId: users.duy.id },
          { fromStatus: "IN_DELIVERY", toStatus: "COMPLETED", byUserId: users.yen.id },
        ],
      },
      ratings: {
        create: [
          { fromUserId: users.yen.id, toUserId: users.duy.id, stars: 5, comment: "Friendly handoff and the book matched the description." },
          { fromUserId: users.duy.id, toUserId: users.yen.id, stars: 5, comment: "Quick communication and arrived on time." },
        ],
      },
    },
  });
  await prisma.listing.update({ where: { id: atomicHabits.id }, data: { status: "COMPLETED" } });

  const accepted = await prisma.transaction.create({
    data: {
      listingId: pragmatic.id,
      ownerId: users.nam.id,
      requesterId: users.quang.id,
      type: "SELL",
      agreedPriceVnd: 50000,
      status: "ACCEPTED",
      acceptedAt: new Date(Date.now() - 86400000),
      events: {
        create: [
          { toStatus: "PENDING", byUserId: users.quang.id },
          { fromStatus: "PENDING", toStatus: "ACCEPTED", byUserId: users.nam.id },
        ],
      },
      conversation: {
        create: {
          userAId: [users.nam.id, users.quang.id].sort()[0],
          userBId: [users.nam.id, users.quang.id].sort()[1],
          messages: {
            create: [
              { senderId: users.quang.id, body: "Could we meet near the university library tomorrow?" },
              { senderId: users.nam.id, body: "Yes, 4 PM works for me. I will bring the book." },
            ],
          },
        },
      },
    },
  });
  await prisma.listing.update({ where: { id: pragmatic.id }, data: { status: "RESERVED" } });

  await prisma.transaction.create({
    data: {
      listingId: mountains.id,
      ownerId: users.mai.id,
      requesterId: users.linh.id,
      type: "EXCHANGE",
      status: "WAITLISTED",
      events: {
        create: [
          { toStatus: "PENDING", byUserId: users.linh.id },
          { fromStatus: "PENDING", toStatus: "WAITLISTED", byUserId: users.mai.id, reason: "another_request_accepted" },
        ],
      },
    },
  });

  await prisma.transaction.create({
    data: {
      listingId: factfulness.id,
      ownerId: users.quang.id,
      requesterId: users.clara.id,
      type: "EXCHANGE",
      status: "DISPUTED",
      acceptedAt: new Date(Date.now() - 18 * 86400000),
      shippedAt: new Date(Date.now() - 16 * 86400000),
      deliveryMethod: "POSTAL",
      trackingNumber: "VN-DEMO-88421",
      events: {
        create: [
          { toStatus: "PENDING", byUserId: users.clara.id },
          { fromStatus: "PENDING", toStatus: "ACCEPTED", byUserId: users.quang.id },
          { fromStatus: "ACCEPTED", toStatus: "IN_DELIVERY", byUserId: users.quang.id },
          { fromStatus: "IN_DELIVERY", toStatus: "DISPUTED", byUserId: users.clara.id, reason: "parcel_arrived_damaged" },
        ],
      },
    },
  });
  await prisma.listing.update({ where: { id: factfulness.id }, data: { status: "RESERVED" } });

  const grammar = listings.find((listing) => listing.title === "English Grammar in Use")!;
  await prisma.transaction.create({
    data: {
      listingId: grammar.id,
      ownerId: users.linh.id,
      requesterId: users.admin.id,
      type: "GIFT",
      status: "PENDING",
      events: { create: [{ toStatus: "PENDING", byUserId: users.admin.id, reason: "admin_demo_request" }] },
    },
  });

  console.log("seed transaction examples:", { completed: completed.id, accepted: accepted.id });
}

async function seedReports(
  users: Awaited<ReturnType<typeof seedUsers>>,
  listings: Awaited<ReturnType<typeof seedListings>>,
) {
  const listing = listings.find((row) => row.title === "The Lean Startup")!;
  await prisma.report.create({
    data: {
      filerId: users.alice.id,
      targetType: "LISTING",
      targetListingId: listing.id,
      targetUserId: listing.ownerId,
      reason: "Demo report",
      details: "Sample pending report for moderation queue demo.",
    },
  });
  const adminTicketListing = listings.find((row) => row.title === "Norwegian Wood")!;
  await prisma.report.create({
    data: {
      filerId: users.admin.id,
      targetType: "LISTING",
      targetListingId: adminTicketListing.id,
      targetUserId: adminTicketListing.ownerId,
      reason: "Admin demo ticket",
      details: "Mock ticket visible from the administrator account for client demonstrations.",
    },
  });
}

async function seedMarketplaceEngagement(
  users: Awaited<ReturnType<typeof seedUsers>>,
  listings: Awaited<ReturnType<typeof seedListings>>,
) {
  const sapiens = listings.find((listing) => listing.title === "Sapiens")!;
  const ddia = listings.find((listing) => listing.title === "Designing Data-Intensive Applications")!;
  await prisma.listingEngagement.createMany({
    data: [
      { userId: users.bob.id, listingId: sapiens.id, kind: "LIKE" },
      { userId: users.clara.id, listingId: sapiens.id, kind: "LIKE" },
      { userId: users.admin.id, listingId: sapiens.id, kind: "WISHLIST" },
      { userId: users.alice.id, listingId: ddia.id, kind: "WISHLIST" },
      { userId: users.admin.id, listingId: ddia.id, kind: "LIKE" },
    ],
    skipDuplicates: true,
  });
}

async function seedArtifactComments(users: Awaited<ReturnType<typeof seedUsers>>) {
  await prisma.artifactComment.deleteMany({
    where: { author: { email: { in: DEMO_EMAILS } } },
  });
  const alchemist = await prisma.artifactComment.create({
    data: {
      artifactSlug: "the-alchemist",
      authorId: users.mai.id,
      body: "The choice between certainty and the unknown makes the Personal Legend feel earned rather than simply destined.",
    },
  });
  const tatDen = await prisma.artifactComment.create({
    data: {
      artifactSlug: "tuc-nuoc-vo-bo",
      authorId: users.linh.id,
      body: "The interactive pressure makes the social injustice in the original scene much harder to observe passively.",
    },
  });
  await prisma.artifactCommentLike.createMany({
    data: [
      { userId: users.admin.id, commentId: alchemist.id },
      { userId: users.clara.id, commentId: alchemist.id },
      { userId: users.admin.id, commentId: tatDen.id },
    ],
    skipDuplicates: true,
  });
  await prisma.artifactComment.update({ where: { id: alchemist.id }, data: { likeCount: 2 } });
  await prisma.artifactComment.update({ where: { id: tatDen.id }, data: { likeCount: 1 } });
}

async function seedCommunityPosts(
  users: Awaited<ReturnType<typeof seedUsers>>,
  communities: Awaited<ReturnType<typeof seedCommunities>>,
  listings: Awaited<ReturnType<typeof seedListings>>,
) {
  const byName = new Map(communities.map((c) => [c.name, c]));
  const listingsByTitle = new Map(listings.map((listing) => [listing.title, listing]));

  const postsData: Array<{
    communityName: string;
    authorId: string;
    title: string;
    body: string;
    isPinned: boolean;
    imageUrl?: string;
    listingTitle?: string;
  }> = [
    {
      communityName: "HUST",
      authorId: users.alice.id,
      title: "Best CS textbooks for 2nd year?",
      body: "Đang tìm sách CTDL+GT và Kiến trúc máy tính. Ai có gợi ý không?",
      isPinned: false,
    },
    {
      communityName: "HUST",
      authorId: users.mod.id,
      title: "Welcome to HUST Readers!",
      body: "Chào mừng mọi người đến với cộng đồng trao đổi sách HUST. Hãy giới thiệu bản thân và sách bạn đang đọc nhé.",
      isPinned: true,
    },
    {
      communityName: "Software Textbooks",
      authorId: users.clara.id,
      title: "DDIA review sau 3 tháng đọc",
      body: "Cuốn Designing Data-Intensive Applications xứng đáng 5 sao. Chapter về replication và consensus là highlight.",
      isPinned: false,
    },
    {
      communityName: "Non-fiction Vietnam",
      authorId: users.bob.id,
      title: "Gợi ý sách lịch sử Việt Nam",
      body: "Ai có sách về lịch sử cận đại VN muốn trao đổi không? Mình đang tìm Bên Thắng Cuộc hoặc tương tự.",
      isPinned: false,
    },
    {
      communityName: "Cau Giay Book Swap",
      authorId: users.duy.id,
      title: "Điểm swap cuối tuần này",
      body: "Mình ở gần Cầu Giấy Tower, ai muốn gặp trực tiếp trao đổi sách thứ 7 này không? Khoảng 9h sáng.",
      isPinned: false,
    },
  ];

  postsData.push(
    {
      communityName: "Vietnamese Literature",
      authorId: users.mai.id,
      title: "Monthly Vietnamese fiction reading circle",
      body: "For this month, should we read The Sorrow of War or The Mountains Sing? React and explain your choice.",
      isPinned: true,
      imageUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1200&q=80",
    },
    {
      communityName: "Language Learners",
      authorId: users.linh.id,
      title: "How do you annotate language-learning books?",
      body: "Share your system for vocabulary notes, review intervals, and keeping workbooks reusable.",
      isPinned: false,
    },
    {
      communityName: "Book News & Discoveries",
      authorId: users.admin.id,
      title: "Welcome to daily book bulletins",
      body: "This feed publishes short source-attributed updates from trusted book APIs and official editorial feeds. Open the original source, then discuss the story here.",
      isPinned: true,
    },
    {
      communityName: "Software Textbooks",
      authorId: users.minh.id,
      title: "For sale: Artificial Intelligence: A Modern Approach",
      body: "I am selling my AI textbook because I finished the course. The corners are worn, but every chapter and diagram is complete. It is a useful reference for search, agents, and machine-learning foundations.",
      isPinned: false,
      listingTitle: "Artificial Intelligence: A Modern Approach",
    },
    {
      communityName: "HUST",
      authorId: users.nam.id,
      title: "For sale: Operating System Concepts",
      body: "Selling my Operating System Concepts textbook for another student to use next semester. The book is in good condition and works well for operating-systems coursework.",
      isPinned: false,
      listingTitle: "Operating System Concepts",
    },
    {
      communityName: "FTU Readers",
      authorId: users.mai.id,
      title: "For sale: The Psychology of Money",
      body: "I have an unread copy available for 45,000 VND. It is a practical book about financial behavior and long-term decision-making. Happy to meet near FTU for the handoff.",
      isPinned: false,
      listingTitle: "The Psychology of Money",
    },
    {
      communityName: "Non-fiction Vietnam",
      authorId: users.minh.id,
      title: "For sale: The Gene",
      body: "Passing on my copy of The Gene after finishing it. It has a few useful sticky tabs but no damaged pages. A good choice for readers interested in science and medical history.",
      isPinned: false,
      listingTitle: "The Gene",
    },
    {
      communityName: "Book News & Discoveries",
      authorId: users.mai.id,
      title: "Open to exchange: Tomorrow, and Tomorrow, and Tomorrow",
      body: "I recently finished this novel and would like it to find another reader. I am especially interested in exchanging it for contemporary fiction or a memoir.",
      isPinned: false,
      listingTitle: "Tomorrow, and Tomorrow, and Tomorrow",
    },
  );

  const createdPosts = [];
  for (const p of postsData) {
    const community = byName.get(p.communityName)!;
    const listing = p.listingTitle ? listingsByTitle.get(p.listingTitle) : undefined;
    const post = await prisma.communityPost.create({
      data: {
        communityId: community.id,
        authorId: p.authorId,
        listingId: listing?.id,
        title: p.title,
        body: p.body,
        imageUrl: "imageUrl" in p ? p.imageUrl : undefined,
        isPinned: p.isPinned,
      },
    });
    createdPosts.push({ post, communityName: p.communityName });
  }

  // Likes
  const likesData = [
    { postIndex: 0, userId: users.bob.id },
    { postIndex: 0, userId: users.duy.id },
    { postIndex: 1, userId: users.alice.id },
    { postIndex: 1, userId: users.bob.id },
    { postIndex: 1, userId: users.duy.id },
    { postIndex: 2, userId: users.alice.id },
    { postIndex: 3, userId: users.alice.id },
    { postIndex: 4, userId: users.bob.id },
  ];
  for (const like of likesData) {
    const { post } = createdPosts[like.postIndex];
    await prisma.communityPostLike.upsert({
      where: { userId_postId: { userId: like.userId, postId: post.id } },
      update: {},
      create: { userId: like.userId, postId: post.id },
    });
    await prisma.communityPost.update({
      where: { id: post.id },
      data: { likeCount: { increment: 1 } },
    });
  }

  // Comments
  const commentsData = [
    { postIndex: 0, authorId: users.bob.id, body: "Mình có Giải thuật và Lập trình của thầy Lê Minh Hoàng, bạn cần không?" },
    { postIndex: 0, authorId: users.duy.id, body: "Tìm CLRS thì khó lắm, thường chỉ có bản PDF thôi." },
    { postIndex: 1, authorId: users.alice.id, body: "Cảm ơn mod! Mình mới join, rất vui được trao đổi sách cùng mọi người 😊" },
    { postIndex: 2, authorId: users.alice.id, body: "Đồng ý! Chapter consensus algorithm đọc xong phải đọc lại 2 lần mới hiểu hết." },
    { postIndex: 3, authorId: users.alice.id, body: "Mình có Bên Thắng Cuộc tập 1, đang tìm tập 2. Trade không?" },
    { postIndex: 4, authorId: users.bob.id, body: "Mình ở Cầu Giấy, sẽ ghé! Mang theo Murakami nhé." },
  ];
  for (const c of commentsData) {
    const { post } = createdPosts[c.postIndex];
    await prisma.communityPostComment.create({
      data: { postId: post.id, authorId: c.authorId, body: c.body },
    });
    await prisma.communityPost.update({
      where: { id: post.id },
      data: { commentCount: { increment: 1 } },
    });
  }

  const parent = await prisma.communityPostComment.findFirst({
    where: { postId: createdPosts[0].post.id },
    orderBy: { createdAt: "asc" },
  });
  if (parent) {
    const reply = await prisma.communityPostComment.create({
      data: {
        postId: createdPosts[0].post.id,
        authorId: users.alice.id,
        parentId: parent.id,
        body: "That sounds useful. Could you add it as a listing so I can request it?",
      },
    });
    await prisma.communityPost.update({
      where: { id: createdPosts[0].post.id },
      data: { commentCount: { increment: 1 } },
    });
    await prisma.communityCommentReaction.createMany({
      data: [
        { userId: users.alice.id, commentId: parent.id, reaction: "LOVE" },
        { userId: users.bob.id, commentId: reply.id, reaction: "CARE" },
      ],
      skipDuplicates: true,
    });
  }
}

async function seedNotifications(
  users: Awaited<ReturnType<typeof seedUsers>>,
  communities: Awaited<ReturnType<typeof seedCommunities>>,
) {
  const hust = communities.find((community) => community.name === "HUST")!;
  await prisma.notification.createMany({
    data: [
      {
        userId: users.admin.id,
        kind: "COMMUNITY_ANNOUNCEMENT",
        payload: { event: "seed.completed", communityId: hust.id },
      },
      {
        userId: users.bob.id,
        kind: "NEW_LISTING_FROM_FOLLOWED",
        payload: { event: "demo.followed_listing", title: "Sapiens" },
      },
    ],
  });
}

function addReason(recipients: Map<string, string[]>, userId: string, reason: string) {
  const reasons = recipients.get(userId) ?? [];
  if (!reasons.includes(reason)) reasons.push(reason);
  recipients.set(userId, reasons);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
