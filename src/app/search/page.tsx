import Link from "next/link";

import { LISTING_GENRES } from "@/lib/listing-genres";
import { genreLabel, humanizeEnum } from "@/lib/labels";
import { listCommunities } from "@/server/communities/service";
import { searchListings, SearchSchema } from "@/server/search/service";

export default async function SearchPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const input = {
    q: single(params?.q),
    genre: single(params?.genre),
    author: single(params?.author),
    condition: single(params?.condition),
    transactionType: single(params?.type),
    maxPrice: single(params?.maxPrice),
    communityId: single(params?.communityId),
    district: single(params?.district),
    distanceKm: single(params?.distanceKm),
    cursor: single(params?.cursor),
    pageSize: 20,
  };
  const parsed = SearchSchema.safeParse(input);
  const [result, communities] = await Promise.all([
    searchListings(parsed.success ? parsed.data : { pageSize: 20 }),
    listCommunities({}),
  ]);
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-blue-600">Discovery</p>
        <h1 className="text-3xl font-black tracking-tight">Search books</h1>
        <p className="mt-1 text-[color:var(--muted)]">Search by title, author, ISBN, genre, community, condition, price, and district radius.</p>
      </div>
      <form className="card-surface grid gap-2 rounded-2xl p-4 md:grid-cols-4">
        <input name="q" defaultValue={single(params?.q) ?? ""} placeholder='Keywords or author:"Harari"' className="rounded border px-2 py-1 md:col-span-2" />
        <select name="genre" defaultValue={single(params?.genre) ?? ""} className="rounded border px-2 py-1">
          <option value="">Any genre</option>
          {LISTING_GENRES.map((genre) => <option key={genre} value={genre}>{genreLabel(genre)}</option>)}
        </select>
        <input name="author" defaultValue={single(params?.author) ?? ""} placeholder="Author" className="rounded border px-2 py-1" />
        <select name="condition" defaultValue={single(params?.condition) ?? ""} className="rounded border px-2 py-1">
          <option value="">Any condition</option>
          {["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"].map((value) => <option key={value} value={value}>{humanizeEnum(value)}</option>)}
        </select>
        <select name="type" defaultValue={single(params?.type) ?? ""} className="rounded border px-2 py-1">
          <option value="">Any type</option>
          {["GIFT", "EXCHANGE", "SELL"].map((value) => <option key={value}>{value}</option>)}
        </select>
        <input name="maxPrice" type="number" min="0" defaultValue={single(params?.maxPrice) ?? ""} placeholder="Max price VND" className="rounded border px-2 py-1" />
        <select name="communityId" defaultValue={single(params?.communityId) ?? ""} className="rounded border px-2 py-1">
          <option value="">Any community</option>
          {communities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}
        </select>
        <input name="district" defaultValue={single(params?.district) ?? ""} placeholder="District, e.g. Cau Giay" className="rounded border px-2 py-1" />
        <input name="distanceKm" type="number" min="1" max="50" defaultValue={single(params?.distanceKm) ?? ""} placeholder="Radius km" className="rounded border px-2 py-1" />
        <button className="btn-primary px-3 py-2">Search</button>
      </form>
      <p className="text-sm text-gray-500">Found {result.items.length} results on this page. District radius uses privacy-safe district centroids.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {result.items.map((listing) => (
          <Link key={listing.id} href={`/listings/${listing.id}`} className="card-surface interactive-card overflow-hidden rounded-2xl p-3">
            {listing.photos[0] && <img src={listing.photos[0].url} alt="" className="mb-3 h-44 w-full rounded-xl object-cover" />}
            <h2 className="text-lg font-bold">{listing.title}</h2>
            <p className="text-sm">{listing.author} · {listing.genre}</p>
            <p className="mt-2 text-xs text-gray-500">{listing.owner.displayName} · {listing.owner.locationDistrict ?? "district unknown"} · relevance {listing.relevance.toFixed(3)}</p>
          </Link>
        ))}
      </div>
      {result.nextCursor && (
        <Link href={`/search?${nextQuery(params, result.nextCursor)}`} className="inline-block rounded border px-3 py-2">Next page</Link>
      )}
    </div>
  );
}

function single(value: string | string[] | undefined) {
  const item = Array.isArray(value) ? value[0] : value;
  return item === undefined || item === "" ? undefined : item;
}

function nextQuery(params: Record<string, string | string[] | undefined> | undefined, cursor: string) {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    const item = single(value);
    if (item && key !== "cursor") out.set(key, item);
  }
  out.set("cursor", cursor);
  return out.toString();
}
