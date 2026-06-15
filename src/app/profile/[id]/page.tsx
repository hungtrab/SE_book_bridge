import Link from "next/link";

import { getCurrentUser } from "@/server/lib/auth-context";
import { getPublicProfile } from "@/server/users/service";
import { ReportButton } from "@/components/moderation/ReportButton";
import { ReputationBadge } from "@/components/reputation/ReputationBadge";
import { TierProgressBar } from "@/components/reputation/TierProgressBar";
import { FollowButton } from "@/components/social/FollowButton";
import { getFollowState } from "@/server/social/follow";

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, viewer] = await Promise.all([
    getPublicProfile(id),
    getCurrentUser(),
  ]);
  const isMe = viewer?.id === profile.id;
  const followState = await getFollowState(viewer?.id, profile.id);

  return (
    <div className="space-y-6">
      <section className="card-surface rounded-2xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{profile.displayName}</h1>
            <div className="mt-1 space-y-2">
              <ReputationBadge score={profile.reputationScore} />
              <TierProgressBar score={profile.reputationScore} />
            </div>
            {profile.locationDistrict && (
              <p className="text-sm text-[color:var(--muted)]">{profile.locationDistrict}</p>
            )}
          </div>
          {isMe && (
            <Link href="/profile/edit" className="btn-primary px-3 py-2 text-sm">
              Edit profile
            </Link>
          )}
          {viewer && !isMe && <ReportButton targetType="USER" targetId={profile.id} />}
          {viewer && !isMe && <FollowButton userId={profile.id} initial={followState.following} initialCount={followState.followerCount} />}
        </div>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          <Link href={`/profile/${profile.id}/followers`} className="link-soft">{followState.followerCount} followers</Link>
          {" · "}
          <Link href={`/profile/${profile.id}/following`} className="link-soft">{followState.followingCount} following</Link>
        </p>
        {profile.bio && <p className="mt-4 whitespace-pre-wrap">{profile.bio}</p>}
        {profile.preferredGenres.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.preferredGenres.map((genre) => (
              <span key={genre} className="badge-soft rounded-full px-2 py-1 text-xs">
                {genre}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Active listings</h2>
        {profile.listings.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No active listings.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.listings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`} className="card-surface interactive-card rounded-2xl p-3">
                <h3 className="font-semibold">{listing.title}</h3>
                <p className="text-sm text-[color:var(--muted)]">{listing.author}</p>
                <p className="mt-2 text-xs text-[color:var(--muted)]">
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
