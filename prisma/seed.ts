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
];

const COMMUNITIES = [
  { name: "HUST", scope: "UNIVERSITY" as const, description: "Hanoi University of Science and Technology readers." },
  { name: "FTU Readers", scope: "UNIVERSITY" as const, description: "Foreign Trade University book exchange." },
  { name: "Cau Giay Book Swap", scope: "LOCATION" as const, description: "District-level sharing around Cau Giay." },
  { name: "Non-fiction Vietnam", scope: "GENRE" as const, description: "History, economics, memoirs and essays." },
  { name: "Software Textbooks", scope: "GENRE" as const, description: "CS, software engineering and programming books." },
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
];

async function main() {
  console.log("seeding...");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const users = await seedUsers(passwordHash);
  const communities = await seedCommunities(users.mod.id);
  await seedMemberships(users, communities);
  await cleanupKnownDemoRows();
  await prisma.communityPostComment.deleteMany({ where: { author: { email: { in: DEMO_EMAILS } } } });
  await prisma.communityPostLike.deleteMany({ where: { user: { email: { in: DEMO_EMAILS } } } });
  await prisma.communityPost.deleteMany({ where: { author: { email: { in: DEMO_EMAILS } } } });
  const listings = await seedListings(users, communities);
  await seedFollows(users);
  await syncFollowCounters();
  await seedFeedItems(listings);
  await seedTransactions(users, listings);
  await seedReports(users, listings);
  await seedCommunityPosts(users, communities);
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
  return { alice, bob, clara, duy, mod, admin };
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
    [users.clara.id, "FTU Readers", "MEMBER"],
    [users.bob.id, "FTU Readers", "MEMBER"],
    [users.alice.id, "Non-fiction Vietnam", "MEMBER"],
    [users.bob.id, "Non-fiction Vietnam", "MEMBER"],
    [users.clara.id, "Software Textbooks", "MEMBER"],
    [users.alice.id, "Software Textbooks", "MEMBER"],
    [users.duy.id, "Cau Giay Book Swap", "MEMBER"],
    [users.bob.id, "Cau Giay Book Swap", "MEMBER"],
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
}

async function seedCommunityPosts(
  users: Awaited<ReturnType<typeof seedUsers>>,
  communities: Awaited<ReturnType<typeof seedCommunities>>,
) {
  const byName = new Map(communities.map((c) => [c.name, c]));

  const postsData = [
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

  const createdPosts = [];
  for (const p of postsData) {
    const community = byName.get(p.communityName)!;
    const post = await prisma.communityPost.create({
      data: {
        communityId: community.id,
        authorId: p.authorId,
        title: p.title,
        body: p.body,
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
