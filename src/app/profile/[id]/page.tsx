import Link from "next/link";

import { getCurrentUser } from "@/server/lib/auth-context";
import { getPublicProfile } from "@/server/users/service";
import { ReportButton } from "@/components/moderation/ReportButton";
import { ReputationBadge } from "@/components/reputation/ReputationBadge";
import { TierProgressBar } from "@/components/reputation/TierProgressBar";

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, viewer] = await Promise.all([
    getPublicProfile(id),
    getCurrentUser(),
  ]);
  const isMe = viewer?.id === profile.id;

  return (
    <div className="space-y-6">
      <section className="rounded border p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{profile.displayName}</h1>
            <div className="mt-1 space-y-2">
              <ReputationBadge score={profile.reputationScore} />
              <TierProgressBar score={profile.reputationScore} />
            </div>
            {profile.locationDistrict && (
              <p className="text-sm text-gray-600">{profile.locationDistrict}</p>
            )}
          </div>
          {isMe && (
            <Link href="/profile/edit" className="rounded bg-blue-600 px-3 py-2 text-sm text-white">
              Edit profile
            </Link>
          )}
          {viewer && !isMe && <ReportButton targetType="USER" targetId={profile.id} />}
        </div>
        {profile.bio && <p className="mt-4 whitespace-pre-wrap">{profile.bio}</p>}
        {profile.preferredGenres.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.preferredGenres.map((genre) => (
              <span key={genre} className="rounded bg-gray-100 px-2 py-1 text-xs">
                {genre}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Active listings</h2>
        {profile.listings.length === 0 ? (
          <p className="text-sm text-gray-600">No active listings.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.listings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`} className="rounded border p-3">
                <h3 className="font-semibold">{listing.title}</h3>
                <p className="text-sm text-gray-600">{listing.author}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {listing.genre} · {listing.condition} · {listing.transactionType}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
