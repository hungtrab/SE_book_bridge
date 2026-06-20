import Link from "next/link";

import { ListingDeleteButton } from "@/components/listings/ListingDeleteButton";
import { RequestListingButton } from "@/components/transactions/RequestListingButton";
import { ReportButton } from "@/components/moderation/ReportButton";
import { ReputationBadge } from "@/components/reputation/ReputationBadge";
import { FollowButton } from "@/components/social/FollowButton";
import { getCurrentUser } from "@/server/lib/auth-context";
import { getListing } from "@/server/listings/service";
import { relatedListings } from "@/server/search/service";
import { getFollowState } from "@/server/social/follow";
import { genreLabel, humanizeEnum } from "@/lib/labels";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [listing, user, related] = await Promise.all([getListing(id), getCurrentUser(), relatedListings(id)]);
  const isOwner = user?.id === listing.ownerId;
  const followState = user && !isOwner
    ? await getFollowState(user.id, listing.ownerId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{listing.title}</h1>
          <p className="text-gray-600">by {listing.author}</p>
          <p className="text-sm text-gray-500">
            Posted {new Date(listing.createdAt).toLocaleString()} by{" "}
            <Link href={`/profile/${listing.owner.id}`} className="underline">
              {listing.owner.displayName}
            </Link>{" "}
            <ReputationBadge score={listing.owner.reputationScore} />
          </p>
          {followState && (
            <div className="mt-3 flex items-center gap-3">
              <FollowButton
                userId={listing.ownerId}
                initial={followState.following}
                initialCount={followState.followerCount}
                compact
              />
              <span className="text-xs text-gray-500">
                Get real-time alerts when {listing.owner.displayName} lists another book.
              </span>
            </div>
          )}
        </div>
        {user && !isOwner && listing.status === "ACTIVE" && <RequestListingButton listingId={listing.id} />}
        {user && !isOwner && <ReportButton targetType="LISTING" targetId={listing.id} />}
        {isOwner && (
          <div className="flex gap-2">
            <Link href={`/listings/${listing.id}/edit`} className="rounded border px-3 py-2">
              Edit
            </Link>
            <ListingDeleteButton id={listing.id} />
          </div>
        )}
      </div>

      {listing.photos.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {listing.photos.map((photo) => (
            <img key={photo.id} src={photo.url} alt="" className="h-56 w-full rounded object-cover" />
          ))}
        </div>
      )}

      <section className="grid gap-3 rounded border p-4 sm:grid-cols-2">
        <Info label="Status" value={humanizeEnum(listing.status)} />
        <Info label="Type" value={humanizeEnum(listing.transactionType)} />
        <Info label="Condition" value={humanizeEnum(listing.condition)} />
        <Info label="Genre" value={genreLabel(listing.genre)} />
        <Info label="ISBN" value={listing.isbn ?? "N/A"} />
        <Info label="Publisher" value={listing.publisher ?? "N/A"} />
        <Info label="Publication year" value={listing.publicationYear?.toString() ?? "N/A"} />
        <Info label="Language" value={listing.language ?? "N/A"} />
        {listing.askingPriceVnd != null && (
          <Info label="Asking price" value={`${listing.askingPriceVnd.toLocaleString()} VND`} />
        )}
        {listing.community && <Info label="Community" value={listing.community.name} />}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Description</h2>
        <p className="whitespace-pre-wrap">{listing.description}</p>
      </section>
      {related.length > 0 && (
        <section>
          <h2 className="mb-2 text-xl font-semibold">Related listings</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <Link key={item.id} href={`/listings/${item.id}`} className="rounded border p-3">
                {item.photos[0] && <img src={item.photos[0].url} alt="" className="mb-2 h-28 w-full rounded object-cover" />}
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm">{item.author}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p>{value}</p>
    </div>
  );
}
