import Link from "next/link";

import { prisma } from "@/server/lib/prisma";
import { listCommunities } from "@/server/communities/service";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const [genres, communities, recent] = await Promise.all([
    prisma.listing.groupBy({ by: ["genre"], where: { status: "ACTIVE" }, _count: true, orderBy: { _count: { genre: "desc" } }, take: 20 }),
    listCommunities({}),
    prisma.listing.findMany({ where: { status: "ACTIVE" }, include: { photos: { take: 1, orderBy: { position: "asc" } } }, orderBy: { createdAt: "desc" }, take: 8 }),
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
        <div className="grid gap-3 sm:grid-cols-4">
          {recent.map((listing) => <Link key={listing.id} href={`/listings/${listing.id}`} className="card-surface interactive-card overflow-hidden rounded-2xl p-3">{listing.photos[0] && <img src={listing.photos[0].url} alt="" className="mb-2 h-32 w-full rounded-xl object-cover" />}<strong>{listing.title}</strong><p className="text-sm text-[color:var(--muted)]">{listing.author}</p></Link>)}
        </div>
      </section>
    </div>
  );
}
