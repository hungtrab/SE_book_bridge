import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_COUNT = Number(process.env.SEARCH_BENCHMARK_LISTINGS ?? 1000);
const BATCH_SIZE = 250;
const OWNER_EMAIL = "search-benchmark@bookbridge.local";
const COMMUNITY_NAME = "Search Benchmark";
const TITLE_PREFIX = "[benchmark]";
const AUTHORS = ["Yuval Noah Harari", "Daniel Kahneman", "Martin Kleppmann", "Tara Westover"];
const GENRES = ["non-fiction", "software", "psychology", "memoir"];
const CONDITIONS = ["NEW", "LIKE_NEW", "GOOD", "FAIR"] as const;
const TYPES = ["GIFT", "EXCHANGE", "SELL"] as const;

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: { status: "ACTIVE", emailVerifiedAt: new Date(), displayName: "Search Benchmark User" },
    create: {
      email: OWNER_EMAIL,
      passwordHash: "benchmark-only",
      displayName: "Search Benchmark User",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      locationDistrict: "Cau Giay",
    },
  });
  const community = await prisma.community.upsert({
    where: { name: COMMUNITY_NAME },
    update: { ownerId: owner.id, scope: "GENRE", description: "Synthetic listings for search latency checks." },
    create: { name: COMMUNITY_NAME, ownerId: owner.id, scope: "GENRE", description: "Synthetic listings for search latency checks." },
  });
  await prisma.communityMembership.upsert({
    where: { userId_communityId: { userId: owner.id, communityId: community.id } },
    update: {},
    create: { userId: owner.id, communityId: community.id, role: "MODERATOR" },
  });

  await prisma.listing.deleteMany({ where: { ownerId: owner.id, title: { startsWith: TITLE_PREFIX } } });

  let created = 0;
  while (created < TARGET_COUNT) {
    const rows: Prisma.ListingCreateManyInput[] = [];
    for (let i = created; i < Math.min(created + BATCH_SIZE, TARGET_COUNT); i += 1) {
      const type = TYPES[i % TYPES.length];
      const harariBoost = i % 10 === 0 ? "harari sapiens homo deus" : "";
      rows.push({
        ownerId: owner.id,
        communityId: community.id,
        title: `${TITLE_PREFIX} ${i.toString().padStart(4, "0")} ${i % 10 === 0 ? "Sapiens" : "Book"}`,
        author: AUTHORS[i % AUTHORS.length],
        genre: GENRES[i % GENRES.length],
        condition: CONDITIONS[i % CONDITIONS.length],
        description: `Synthetic benchmark listing ${i}. ${harariBoost} Useful for PostgreSQL full-text search latency checks.`,
        transactionType: type,
        askingPriceVnd: type === "SELL" ? 30_000 : null,
        status: "ACTIVE",
      });
    }
    await prisma.listing.createMany({ data: rows });
    created += rows.length;
  }

  const started = performance.now();
  const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "Listing" l
    WHERE l."status" = 'ACTIVE'::"ListingStatus"
      AND l.search_vector @@ websearch_to_tsquery('simple', 'harari')
  `;
  const elapsedMs = performance.now() - started;

  console.log({
    benchmarkListings: TARGET_COUNT,
    query: "harari",
    matches: Number(result[0]?.count ?? 0),
    elapsedMs: Math.round(elapsedMs * 100) / 100,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    return prisma.$disconnect().then(() => process.exit(1));
  });
