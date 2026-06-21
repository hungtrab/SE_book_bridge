import Link from "next/link";
import { BookOpen, MapPin, ShieldCheck, Star } from "lucide-react";

import { ListingDeleteButton } from "@/components/listings/ListingDeleteButton";
import { ListingEngagementButtons } from "@/components/listings/ListingEngagementButtons";
import { DirectMessageButton } from "@/components/messaging/DirectMessageButton";
import { ReportButton } from "@/components/moderation/ReportButton";
import { FollowButton } from "@/components/social/FollowButton";
import { RequestListingButton } from "@/components/transactions/RequestListingButton";
import { genreLabel, humanizeEnum } from "@/lib/labels";
import { getCurrentUser } from "@/server/lib/auth-context";
import { getListing } from "@/server/listings/service";
import { relatedListings } from "@/server/search/service";
import { getFollowState } from "@/server/social/follow";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const [listing, related] = await Promise.all([getListing(id, user?.id), relatedListings(id)]);
  const isOwner = user?.id === listing.ownerId;
  const followState = user && !isOwner ? await getFollowState(user.id, listing.ownerId) : null;
  const engagement = {
    likes: listing.engagements.filter((item) => item.kind === "LIKE").length,
    wishlists: listing.engagements.filter((item) => item.kind === "WISHLIST").length,
    liked: listing.engagements.some((item) => item.kind === "LIKE" && item.userId === user?.id),
    wishlisted: listing.engagements.some((item) => item.kind === "WISHLIST" && item.userId === user?.id),
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/search" className="text-sm font-semibold text-blue-600 hover:underline">Back to search</Link>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <main className="space-y-5">
          <section className="community-card overflow-hidden">
            <div className="grid gap-2 bg-slate-100 sm:grid-cols-2">
              {listing.photos.length > 0 ? listing.photos.map((photo, index) => (
                <img
                  key={photo.id}
                  src={photo.url}
                  alt={index === 0 ? listing.title : ""}
                  className={`w-full object-cover ${index === 0 ? "h-[430px] sm:col-span-2" : "h-56"}`}
                />
              )) : (
                <div className="grid h-[430px] place-items-center sm:col-span-2">
                  <BookOpen size={52} className="text-slate-300" />
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                <span className="listing-category">{genreLabel(listing.genre)}</span>
                <span className="listing-meta-chip">{humanizeEnum(listing.condition)}</span>
                <span className="listing-meta-chip">{humanizeEnum(listing.transactionType)}</span>
                <span className="listing-meta-chip">{humanizeEnum(listing.status)}</span>
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight">{listing.title}</h1>
              <p className="mt-1 text-lg text-slate-600">by {listing.author}</p>
              <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-700">{listing.description}</p>
            </div>
          </section>

          <section className="community-card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <Info label="ISBN" value={listing.isbn ?? "Not provided"} />
            <Info label="Publisher" value={listing.publisher ?? "Not provided"} />
            <Info label="Publication year" value={listing.publicationYear?.toString() ?? "Not provided"} />
            <Info label="Language" value={listing.language ?? "Not provided"} />
            <Info label="Category" value={genreLabel(listing.genre)} />
            <Info label="Community" value={listing.community?.name ?? "Global listing"} />
          </section>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="community-card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Available from</p>
            <div className="mt-4 flex items-center gap-3">
              <Link href={`/profile/${listing.owner.id}`} className="grid size-14 place-items-center overflow-hidden rounded-full bg-blue-600 font-black text-white">
                {listing.owner.avatarUrl
                  ? <img src={listing.owner.avatarUrl} alt="" className="h-full w-full object-cover" />
                  : listing.owner.displayName.slice(0, 2).toUpperCase()}
              </Link>
              <div>
                <Link href={`/profile/${listing.owner.id}`} className="text-lg font-black hover:text-blue-600">
                  {listing.owner.displayName}
                </Link>
                <p className="flex items-center gap-1 text-sm text-slate-500">
                  <Star size={15} /> {listing.owner.reputationScore} points · {listing.owner.reputationTier}
                </p>
                {listing.owner.locationDistrict && (
                  <p className="flex items-center gap-1 text-sm text-slate-500"><MapPin size={15} />{listing.owner.locationDistrict}</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
              <ShieldCheck size={18} /> Reputation and completed exchanges help you trade confidently.
            </div>
            {!isOwner && (
              <div className="mt-4 flex flex-wrap gap-2">
                <DirectMessageButton userId={listing.ownerId} signedIn={Boolean(user)} />
                {followState && (
                  <FollowButton
                    userId={listing.ownerId}
                    initial={followState.following}
                    initialCount={followState.followerCount}
                    compact
                  />
                )}
              </div>
            )}
          </section>

          <section className="community-card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Offer</p>
            <p className="mt-2 text-3xl font-black">
              {listing.transactionType === "SELL"
                ? `${(listing.askingPriceVnd ?? 0).toLocaleString()} VND`
                : listing.transactionType === "EXCHANGE" ? "Book exchange" : "Free gift"}
            </p>
            {!isOwner && (
              <div className="mt-4 space-y-3">
                <ListingEngagementButtons listingId={listing.id} initial={engagement} signedIn={Boolean(user)} />
                {user && listing.status === "ACTIVE" && <RequestListingButton listingId={listing.id} />}
                {!user && <Link href="/login" className="btn-primary w-full">Sign in to request</Link>}
                {user && <ReportButton targetType="LISTING" targetId={listing.id} />}
              </div>
            )}
            {isOwner && (
              <div className="mt-4 flex gap-2">
                <Link href={`/listings/${listing.id}/edit`} className="btn-secondary">Edit</Link>
                <ListingDeleteButton id={listing.id} />
              </div>
            )}
          </section>
        </aside>
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-black">Related books</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <Link key={item.id} href={`/listings/${item.id}`} className="community-card overflow-hidden">
                {item.photos[0] && <img src={item.photos[0].url} alt="" className="h-36 w-full object-cover" />}
                <div className="p-3"><h3 className="font-bold">{item.title}</h3><p className="text-sm text-slate-500">{item.author}</p></div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}
