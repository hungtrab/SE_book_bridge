import Link from "next/link";
import { Plus, Search, SlidersHorizontal } from "lucide-react";

import { ListingHorizontalCard } from "@/components/listings/ListingHorizontalCard";
import { LISTING_GENRES } from "@/lib/listing-genres";
import { genreLabel, humanizeEnum } from "@/lib/labels";
import { listCommunities } from "@/server/communities/service";
import { getCurrentUser } from "@/server/lib/auth-context";
import { searchListings, SearchSchema } from "@/server/search/service";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
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
    searchListings(parsed.success ? parsed.data : { pageSize: 20 }, user?.id),
    listCommunities({}),
  ]);
  const advancedOpen = ["author", "condition", "type", "maxPrice", "communityId", "district", "distanceKm"]
    .some((key) => Boolean(single(params?.[key])));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600">Book marketplace</p>
          <h1 className="text-3xl font-black tracking-tight">Search and discover listings</h1>
          <p className="mt-1 text-sm text-slate-600">
            Find a book, inspect the seller, save it, or start a conversation from one place.
          </p>
        </div>
        {user && (
          <Link href="/listings/new" className="btn-primary">
            <Plus size={17} /> List a book
          </Link>
        )}
      </header>

      <form className="community-card overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              name="q"
              defaultValue={single(params?.q) ?? ""}
              placeholder="Title, author, ISBN, genre, or community"
              className="field min-h-12 pl-10"
            />
          </label>
          <select name="genre" defaultValue={single(params?.genre) ?? ""} className="field min-h-12 sm:w-48">
            <option value="">Every category</option>
            {LISTING_GENRES.map((genre) => <option key={genre} value={genre}>{genreLabel(genre)}</option>)}
          </select>
          <button className="btn-primary min-h-12 px-5"><Search size={17} /> Search</button>
        </div>

        <details className="border-t border-slate-200" open={advancedOpen}>
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
            <SlidersHorizontal size={16} /> Advanced search
            <span className="ml-auto text-xs font-medium text-slate-400">Author, condition, price, community, and distance</span>
          </summary>
          <div className="grid gap-3 border-t border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <input name="author" defaultValue={single(params?.author) ?? ""} placeholder="Author" className="field" />
            <select name="condition" defaultValue={single(params?.condition) ?? ""} className="field">
              <option value="">Any condition</option>
              {["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"].map((value) => <option key={value} value={value}>{humanizeEnum(value)}</option>)}
            </select>
            <select name="type" defaultValue={single(params?.type) ?? ""} className="field">
              <option value="">Gift, exchange, or sale</option>
              {["GIFT", "EXCHANGE", "SELL"].map((value) => <option key={value} value={value}>{humanizeEnum(value)}</option>)}
            </select>
            <input name="maxPrice" type="number" min="0" defaultValue={single(params?.maxPrice) ?? ""} placeholder="Maximum price (VND)" className="field" />
            <select name="communityId" defaultValue={single(params?.communityId) ?? ""} className="field">
              <option value="">Any community</option>
              {communities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}
            </select>
            <input name="district" defaultValue={single(params?.district) ?? ""} placeholder="District, e.g. Cau Giay" className="field" />
            <input name="distanceKm" type="number" min="1" max="50" defaultValue={single(params?.distanceKm) ?? ""} placeholder="Radius in km" className="field" />
            <button className="btn-secondary">Apply advanced filters</button>
          </div>
        </details>
      </form>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-600">{result.items.length} books shown</p>
        <p className="text-xs text-slate-400">Results prioritize title, author, ISBN, and category matches.</p>
      </div>

      <div className="space-y-3">
        {result.items.map((listing) => (
          <ListingHorizontalCard key={listing.id} listing={listing} currentUserId={user?.id} />
        ))}
        {result.items.length === 0 && (
          <div className="community-card p-10 text-center">
            <h2 className="font-bold">No matching books yet</h2>
            <p className="mt-1 text-sm text-slate-500">Try fewer filters or list the book you want others to discover.</p>
          </div>
        )}
      </div>

      {result.nextCursor && (
        <Link href={`/search?${nextQuery(params, result.nextCursor)}`} className="btn-secondary">
          Load next page
        </Link>
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
