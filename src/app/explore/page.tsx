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
      <h1 className="text-2xl font-bold">Explore BookBridge</h1>
      <section>
        <h2 className="mb-2 text-xl font-semibold">Browse genres</h2>
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => <Link key={genre.genre} href={`/search?genre=${encodeURIComponent(genre.genre)}`} className="rounded border px-3 py-2">{genre.genre} ({genre._count})</Link>)}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold">Popular communities</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {communities.slice(0, 9).map((community) => <Link key={community.id} href={`/communities/${community.id}`} className="rounded border p-3"><strong>{community.name}</strong><p className="text-sm">{community.memberCount} members</p></Link>)}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold">Recently listed</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          {recent.map((listing) => <Link key={listing.id} href={`/listings/${listing.id}`} className="rounded border p-3">{listing.photos[0] && <img src={listing.photos[0].url} alt="" className="mb-2 h-28 w-full rounded object-cover" />}<strong>{listing.title}</strong><p className="text-sm">{listing.author}</p></Link>)}
        </div>
      </section>
    </div>
  );
}
