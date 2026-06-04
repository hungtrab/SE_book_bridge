import Link from "next/link";

import { CommunityActions } from "@/components/communities/CommunityActions";
import { getCurrentUser } from "@/server/lib/auth-context";
import { getCommunity } from "@/server/communities/service";

export default async function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const community = await getCommunity(id, user?.id);
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{community.name}</h1>
          <p>{community.scope} · {community.memberCount} members</p>
          <p className="text-gray-600">{community.description ?? "No description"}</p>
          <p className="text-sm">Owner: {community.owner.displayName}</p>
        </div>
        {user && <CommunityActions id={community.id} joined={Boolean(community.myMembership)} isOwner={community.ownerId === user.id} />}
      </div>
      <section>
        <h2 className="mb-2 text-xl font-semibold">Active listings</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {community.listings.map((listing) => (
            <Link key={listing.id} href={`/listings/${listing.id}`} className="rounded border p-3">
              {listing.photos[0] && <img src={listing.photos[0].url} alt="" className="mb-2 h-32 w-full rounded object-cover" />}
              <h3 className="font-semibold">{listing.title}</h3>
              <p className="text-sm">{listing.author}</p>
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold">Members</h2>
        <div className="flex flex-wrap gap-2">
          {community.memberships.map((membership) => (
            <Link key={membership.userId} href={`/profile/${membership.userId}`} className="rounded border px-2 py-1 text-sm">
              {membership.user.displayName} · {membership.role}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
