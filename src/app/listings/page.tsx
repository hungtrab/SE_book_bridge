import Link from "next/link";

import { searchListings } from "@/server/listings/service";

export default async function ListingsPage() {
  const listings = await searchListings({ pageSize: 20 });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All listings</h1>
        <Link href="/listings/new" className="px-3 py-1 rounded bg-blue-600 text-white text-sm">
          + New
        </Link>
      </div>

      {listings.length === 0 ? (
        <p className="text-[color:var(--muted)]">No listings yet — be the first.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {listings.map((l) => (
            <li key={l.id} className="border rounded p-3">
              <Link href={`/listings/${l.id}`} className="font-semibold">
                {l.title}
              </Link>
              <p className="text-sm text-[color:var(--muted)]">by {l.author}</p>
              <p className="text-xs mt-1">
                {l.transactionType} · {l.condition} · {l.genre}
                {l.askingPriceVnd != null && (
                  <span> · {l.askingPriceVnd.toLocaleString()} VND</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
