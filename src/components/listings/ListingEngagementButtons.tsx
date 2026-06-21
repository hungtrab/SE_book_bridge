"use client";

import { Bookmark, Heart } from "lucide-react";
import { useState } from "react";

type Kind = "LIKE" | "WISHLIST";

export function ListingEngagementButtons({
  listingId,
  initial,
  signedIn,
}: {
  listingId: string;
  initial: { likes: number; wishlists: number; liked: boolean; wishlisted: boolean };
  signedIn: boolean;
}) {
  const [state, setState] = useState(initial);
  const [pending, setPending] = useState<Kind | null>(null);

  async function toggle(kind: Kind) {
    if (!signedIn) {
      window.location.href = `/login?next=${encodeURIComponent(`/listings/${listingId}`)}`;
      return;
    }
    const active = kind === "LIKE" ? state.liked : state.wishlisted;
    setPending(kind);
    const res = await fetch(
      active ? `/api/listings/${listingId}/engagement?kind=${kind}` : `/api/listings/${listingId}/engagement`,
      {
        method: active ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: active ? undefined : JSON.stringify({ kind }),
      },
    );
    setPending(null);
    if (!res.ok) return;
    const out = await res.json();
    setState((current) => kind === "LIKE"
      ? { ...current, liked: out.active, likes: out.count }
      : { ...current, wishlisted: out.active, wishlists: out.count });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className={`listing-icon-action ${state.liked ? "is-active text-rose-600" : ""}`}
        onClick={() => toggle("LIKE")}
        disabled={pending === "LIKE"}
        title="Like listing"
        aria-label={`Like listing, ${state.likes} likes`}
      >
        <Heart size={17} fill={state.liked ? "currentColor" : "none"} />
        <span>{state.likes}</span>
      </button>
      <button
        type="button"
        className={`listing-icon-action ${state.wishlisted ? "is-active text-blue-600" : ""}`}
        onClick={() => toggle("WISHLIST")}
        disabled={pending === "WISHLIST"}
        title="Save to wishlist"
        aria-label={`Save to wishlist, ${state.wishlists} saves`}
      >
        <Bookmark size={17} fill={state.wishlisted ? "currentColor" : "none"} />
        <span>{state.wishlists}</span>
      </button>
    </div>
  );
}
