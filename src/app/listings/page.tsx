import Link from "next/link";

import { ListingQuerySchema, searchListings } from "@/server/listings/service";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const parsed = ListingQuerySchema.safeParse({
    q: single(params?.q),
    genre: single(params?.genre),
    condition: single(params?.condition),
    transactionType: single(params?.type),
    maxPrice: single(params?.maxPrice),
    cursor: single(params?.cursor),
    pageSize: 20,
  });
  const result = await searchListings(parsed.success ? parsed.data : { pageSize: 20 });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All listings</h1>
        <Link href="/listings/new" className="px-3 py-1 rounded bg-blue-600 text-white text-sm">
          + New
        </Link>
      </div>

      <form className="grid gap-2 rounded border p-3 sm:grid-cols-5">
        <input name="q" placeholder="Search title, author, ISBN" className="rounded border px-2 py-1 sm:col-span-2" defaultValue={single(params?.q) ?? ""} />
        <input name="genre" placeholder="Genre" className="rounded border px-2 py-1" defaultValue={single(params?.genre) ?? ""} />
        <select name="type" className="rounded border px-2 py-1" defaultValue={single(params?.type) ?? ""}>
          <option value="">Any type</option>
          <option value="GIFT">Gift</option>
          <option value="EXCHANGE">Exchange</option>
          <option value="SELL">Sell</option>
        </select>
        <button className="rounded bg-blue-600 px-3 py-2 text-white">Filter</button>
      </form>

      {result.items.length === 0 ? (
        <p className="text-[color:var(--muted)]">No listings yet — be the first.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {result.items.map((l) => (
            <li key={l.id} className="border rounded p-3">
              {l.photos[0] && (
                <img src={l.photos[0].url} alt="" className="mb-3 h-40 w-full rounded object-cover" />
              )}
              <Link href={`/listings/${l.id}`} className="font-semibold">
                {l.title}
              </Link>
              <p className="text-sm text-[color:var(--muted)]">
                by {l.author} · owner {l.owner.displayName} ({l.owner.reputationTier})
              </p>
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

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
