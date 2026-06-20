import Link from "next/link";

import { LISTING_GENRES } from "@/lib/listing-genres";
import { genreLabel, humanizeEnum } from "@/lib/labels";
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Marketplace</p>
          <h1 className="text-3xl font-black tracking-tight">All listings</h1>
        </div>
        <Link href="/listings/new" className="btn-primary px-4 py-2 text-sm">
          + New
        </Link>
      </div>

      <form className="card-surface grid gap-2 rounded-2xl p-4 sm:grid-cols-5">
        <input name="q" placeholder="Search title, author, ISBN" className="rounded border px-2 py-1 sm:col-span-2" defaultValue={single(params?.q) ?? ""} />
        <select name="genre" className="rounded border px-2 py-1" defaultValue={single(params?.genre) ?? ""}>
          <option value="">Any genre</option>
          {LISTING_GENRES.map((genre) => <option key={genre} value={genre}>{genreLabel(genre)}</option>)}
        </select>
        <select name="type" className="rounded border px-2 py-1" defaultValue={single(params?.type) ?? ""}>
          <option value="">Any type</option>
          <option value="GIFT">Gift</option>
          <option value="EXCHANGE">Exchange</option>
          <option value="SELL">Sell</option>
        </select>
        <button className="btn-primary px-3 py-2">Filter</button>
      </form>

      {result.items.length === 0 ? (
        <p className="text-[color:var(--muted)]">No listings yet — be the first.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {result.items.map((l) => (
            <li key={l.id} className="card-surface interactive-card overflow-hidden rounded-2xl p-3">
              {l.photos[0] && (
                <img src={l.photos[0].url} alt="" className="mb-3 h-44 w-full rounded-xl object-cover transition duration-300 hover:scale-[1.02]" />
              )}
              <Link href={`/listings/${l.id}`} className="text-lg font-bold hover:text-blue-600">
                {l.title}
              </Link>
              <p className="text-sm text-[color:var(--muted)]">
                by {l.author} · owner {l.owner.displayName} ({l.owner.reputationTier})
              </p>
              <p className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className={`rounded-full px-2 py-1 font-semibold ${
                  l.transactionType === "SELL"
                    ? "bg-amber-100 text-amber-700"
                    : l.transactionType === "EXCHANGE"
                    ? "bg-violet-100 text-violet-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}>{humanizeEnum(l.transactionType)}</span>
                <span className="badge-soft rounded-full px-2 py-1">{humanizeEnum(l.condition)}</span>
                <span className="badge-soft rounded-full px-2 py-1">{genreLabel(l.genre)}</span>
              </p>
              <p className="mt-2 text-sm font-semibold">
                {l.transactionType === "SELL"
                  ? `${(l.askingPriceVnd ?? 0).toLocaleString()} VND`
                  : l.transactionType === "EXCHANGE"
                  ? "Open to swap"
                  : "Free gift"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function single(value: string | string[] | undefined): string | undefined {
  const item = Array.isArray(value) ? value[0] : value;
  return item === undefined || item === "" ? undefined : item;
}
