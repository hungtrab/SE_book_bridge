import Link from "next/link";
import { ArrowRight, BookOpen, Gift, RefreshCw, ShoppingBag } from "lucide-react";

import { humanizeEnum } from "@/lib/labels";

export type PostListing = {
  id: string;
  title: string;
  author: string;
  condition: string;
  transactionType: string;
  askingPriceVnd: number | null;
  status?: string;
  photos: Array<{ url: string }>;
};

function transactionLabel(listing: PostListing) {
  if (listing.transactionType === "SELL") {
    return listing.askingPriceVnd == null
      ? "For sale"
      : `${listing.askingPriceVnd.toLocaleString("vi-VN")} VND`;
  }
  return listing.transactionType === "GIFT" ? "Free to a new reader" : "Open to exchange";
}

function TransactionIcon({ type }: { type: string }) {
  if (type === "SELL") return <ShoppingBag size={17} />;
  if (type === "GIFT") return <Gift size={17} />;
  return <RefreshCw size={17} />;
}

export function ListingPostAttachment({
  listing,
  compact = false,
}: {
  listing: PostListing;
  compact?: boolean;
}) {
  const unavailable = listing.status !== undefined && listing.status !== "ACTIVE";

  if (compact) {
    return (
      <div className="flex min-w-0 items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
        {listing.photos[0] ? (
          <img src={listing.photos[0].url} alt="" className="h-16 w-14 flex-none rounded-md object-cover" />
        ) : (
          <span className="grid h-16 w-14 flex-none place-items-center rounded-md bg-white text-blue-600">
            <BookOpen size={22} />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-bold text-slate-900">{listing.title}</p>
          <p className="truncate text-sm text-slate-600">{listing.author}</p>
          <p className="mt-1 text-xs font-semibold text-blue-700">{transactionLabel(listing)}</p>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group mx-4 mb-3 grid overflow-hidden rounded-lg border border-slate-200 bg-slate-50 transition hover:border-blue-300 hover:bg-blue-50 sm:grid-cols-[150px_minmax(0,1fr)]"
    >
      {listing.photos[0] ? (
        <img
          src={listing.photos[0].url}
          alt=""
          className="h-44 w-full bg-slate-100 object-cover sm:h-full"
        />
      ) : (
        <span className="grid h-36 place-items-center bg-slate-100 text-slate-400 sm:h-full">
          <BookOpen size={34} />
        </span>
      )}
      <span className="flex min-w-0 flex-col justify-between gap-4 p-4">
        <span>
          <span className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">
              <TransactionIcon type={listing.transactionType} />
              {transactionLabel(listing)}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
              {humanizeEnum(listing.condition)}
            </span>
            {unavailable && (
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {humanizeEnum(listing.status ?? "UNAVAILABLE")}
              </span>
            )}
          </span>
          <strong className="block text-lg text-slate-950">{listing.title}</strong>
          <span className="mt-1 block text-sm text-slate-600">by {listing.author}</span>
        </span>
        <span className="flex items-center justify-between text-sm font-bold text-blue-700">
          <span>{unavailable ? "View book details" : "View listing and request book"}</span>
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
        </span>
      </span>
    </Link>
  );
}
