import Link from "next/link";
import { MapPin, Star } from "lucide-react";

import { DirectMessageButton } from "@/components/messaging/DirectMessageButton";
import { FollowButton } from "@/components/social/FollowButton";
import { genreLabel, humanizeEnum } from "@/lib/labels";
import { ListingEngagementButtons } from "./ListingEngagementButtons";

export type ListingCardData = {
  id: string;
  ownerId: string;
  title: string;
  author: string;
  genre: string;
  condition: string;
  transactionType: string;
  askingPriceVnd: number | null;
  description?: string;
  photos: Array<{ url: string }>;
  community?: { id: string; name: string } | null;
  owner: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    reputationScore: number;
    reputationTier: string;
    followerCount?: number;
    locationDistrict?: string | null;
    followers?: Array<{ followerId: string }>;
  };
  engagements?: Array<{ kind: "LIKE" | "WISHLIST"; userId?: string }>;
};

export function ListingHorizontalCard({
  listing,
  currentUserId,
  showFollow = true,
}: {
  listing: ListingCardData;
  currentUserId?: string;
  showFollow?: boolean;
}) {
  const isOwner = currentUserId === listing.ownerId;
  const engagements = listing.engagements ?? [];
  const summary = {
    likes: engagements.filter((item) => item.kind === "LIKE").length,
    wishlists: engagements.filter((item) => item.kind === "WISHLIST").length,
    liked: engagements.some((item) => item.kind === "LIKE" && item.userId === currentUserId),
    wishlisted: engagements.some((item) => item.kind === "WISHLIST" && item.userId === currentUserId),
  };

  return (
    <article className="listing-row-card">
      <Link href={`/listings/${listing.id}`} className="listing-row-cover" aria-label={`Open ${listing.title}`}>
        {listing.photos[0] ? (
          <img src={listing.photos[0].url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-slate-400">No cover</span>
        )}
      </Link>

      <div className="min-w-0 flex-1 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="listing-category">{genreLabel(listing.genre)}</span>
              <span className="listing-meta-chip">{humanizeEnum(listing.condition)}</span>
              <span className="listing-meta-chip">{humanizeEnum(listing.transactionType)}</span>
            </div>
            <Link href={`/listings/${listing.id}`} className="text-xl font-black text-slate-950 hover:text-blue-600">
              {listing.title}
            </Link>
            <p className="mt-0.5 text-sm text-slate-600">by {listing.author}</p>
          </div>
          <p className="text-lg font-black text-slate-950">
            {listing.transactionType === "SELL"
              ? `${(listing.askingPriceVnd ?? 0).toLocaleString()} VND`
              : listing.transactionType === "EXCHANGE" ? "Open to swap" : "Free gift"}
          </p>
        </div>

        {listing.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{listing.description}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <Link href={`/profile/${listing.owner.id}`} className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-blue-600 text-xs font-black text-white">
              {listing.owner.avatarUrl
                ? <img src={listing.owner.avatarUrl} alt="" className="h-full w-full object-cover" />
                : listing.owner.displayName.slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-sm text-slate-900">{listing.owner.displayName}</strong>
              <span className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1"><Star size={12} />{listing.owner.reputationScore} {listing.owner.reputationTier}</span>
                {listing.owner.locationDistrict && <span className="inline-flex items-center gap-1"><MapPin size={12} />{listing.owner.locationDistrict}</span>}
              </span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {!isOwner && (
              <ListingEngagementButtons listingId={listing.id} initial={summary} signedIn={Boolean(currentUserId)} />
            )}
            {!isOwner && <DirectMessageButton userId={listing.ownerId} signedIn={Boolean(currentUserId)} compact />}
            {!isOwner && showFollow && currentUserId && (
              <FollowButton
                userId={listing.ownerId}
                initial={Boolean(listing.owner.followers?.length)}
                initialCount={listing.owner.followerCount ?? 0}
                compact
              />
            )}
            <Link href={`/listings/${listing.id}`} className="btn-primary btn-sm">View book</Link>
          </div>
        </div>
      </div>
    </article>
  );
}
