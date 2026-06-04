"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type FeedRow = {
  id: string;
  seen: boolean;
  createdAt: string | Date;
  payload: unknown;
  listing: {
    id: string;
    title: string;
    author: string;
    transactionType: string;
    genre: string;
    photos: Array<{ url: string }>;
    owner: { displayName: string; reputationTier: string };
    community: { name: string } | null;
  } | null;
};

export function FeedList({ initial }: { initial: FeedRow[] }) {
  const [items, setItems] = useState(initial);

  useEffect(() => {
    const unseen = initial.filter((item) => !item.seen).map((item) => item.id);
    if (unseen.length) {
      fetch("/api/feed", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unseen }),
      }).catch(() => undefined);
    }
    const source = new EventSource("/api/feed/stream");
    source.addEventListener("feed-item", (event) => {
      const item = JSON.parse((event as MessageEvent).data) as FeedRow;
      setItems((current) => current.some((row) => row.id === item.id) ? current : [item, ...current]);
    });
    return () => source.close();
  }, [initial]);

  if (items.length === 0) {
    return <p>Follow users or join communities to build your feed.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => item.listing && (
        <Link key={item.id} href={`/listings/${item.listing.id}`} className={`rounded border p-3 ${item.seen ? "" : "border-blue-500"}`}>
          {item.listing.photos[0] && <img src={item.listing.photos[0].url} alt="" className="mb-2 h-36 w-full rounded object-cover" />}
          <h3 className="font-semibold">{item.listing.title}</h3>
          <p className="text-sm">{item.listing.author}</p>
          <p className="text-xs text-gray-500">
            {item.listing.owner.displayName} · {item.listing.transactionType} · {item.listing.genre}
            {item.listing.community ? ` · ${item.listing.community.name}` : ""}
          </p>
        </Link>
      ))}
    </div>
  );
}
