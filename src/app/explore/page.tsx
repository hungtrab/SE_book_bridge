import Link from "next/link";

import { ListingHorizontalCard } from "@/components/listings/ListingHorizontalCard";
import { prisma } from "@/server/lib/prisma";
import { listCommunities } from "@/server/communities/service";
import { getCurrentUser } from "@/server/lib/auth-context";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const user = await getCurrentUser();
  const [genres, communities, recent] = await Promise.all([
    prisma.listing.groupBy({ by: ["genre"], where: { status: "ACTIVE" }, _count: true, orderBy: { _count: { genre: "desc" } }, take: 20 }),
    listCommunities({}),
    prisma.listing.findMany({
      where: { status: "ACTIVE" },
      include: {
        photos: { take: 1, orderBy: { position: "asc" } },
        community: { select: { id: true, name: true } },
        engagements: { select: { kind: true, userId: true } },
        owner: {
          select: {
            id: true, displayName: true, avatarUrl: true, reputationScore: true,
            reputationTier: true, followerCount: true, locationDistrict: true,
            followers: user
              ? { where: { followerId: user.id }, select: { followerId: true } }
              : false,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);
  return (
    <div className="space-y-6">
      <section className="card-surface rounded-3xl p-7">
        <p className="text-sm font-semibold text-blue-600">Explore</p>
        <h1 className="text-4xl font-black tracking-tight">Find the right corner of BookBridge</h1>
        <p className="mt-2 text-[color:var(--muted)]">Browse genres, communities, and fresh listings from active readers.</p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold">Browse genres</h2>
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => <Link key={genre.genre} href={`/search?genre=${encodeURIComponent(genre.genre)}`} className="badge-soft rounded-full px-3 py-2 text-sm font-semibold transition hover:border-blue-400 hover:text-blue-600">{genre.genre} ({genre._count})</Link>)}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold">Popular communities</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {communities.slice(0, 9).map((community) => <Link key={community.id} href={`/communities/${community.id}`} className="card-surface interactive-card rounded-2xl p-4"><strong>{community.name}</strong><p className="text-sm text-[color:var(--muted)]">{community.memberCount} members</p></Link>)}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold">Recently listed</h2>
        <div className="space-y-3">
          {recent.map((listing) => <ListingHorizontalCard key={listing.id} listing={listing} currentUserId={user?.id} />)}
        </div>
      </section>
    </div>
  );
}
