import Link from "next/link";

import { findListingsForBook } from "@/server/listings/book-match";

// Async server component: queries the database for the listings users posted for
// this book (gift / exchange / sell) and shows them inline, instead of only
// linking to a search. Fuzzy matching means "The Alchemist" still finds a
// listing posted as "The AIchemist" (see src/server/listings/book-match.ts).
export async function ArtifactListingLink({
  title,
  accentColor,
}: {
  title: string;
  accentColor: string;
}) {
  const matches = await findListingsForBook(title);
  const searchHref = `/listings?${new URLSearchParams({ q: title }).toString()}`;
  // The button goes straight to the best-matching listing when one exists
  // (plain /search uses exact matching and would miss near-typos like
  // "The AIchemist"); otherwise it falls back to a marketplace search.
  const primaryHref = matches.length > 0 ? `/listings/${matches[0].id}` : searchHref;

  return (
    <section
      id="artifact-listings"
      className="mx-auto mt-6 max-w-4xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-blue-600">Book listing</p>
          <h2 className="text-lg font-black text-slate-900">Want the physical book?</h2>
          <p className="text-sm text-slate-500">
            {matches.length > 0
              ? `${matches.length} matching listing${matches.length > 1 ? "s" : ""} on the marketplace.`
              : `Search marketplace listings for ${title}.`}
          </p>
        </div>
        <Link
          href={primaryHref}
          className="rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5"
          style={{ background: accentColor }}
        >
          See this book on listing
        </Link>
      </div>

      {matches.length > 0 ? (
        // Matches found -> list them, each linking to its listing detail page.
        <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
          {matches.map((m) => (
            <li key={m.id}>
              <Link
                href={`/listings/${m.id}`}
                className="flex items-center gap-3 py-3 transition-colors hover:bg-slate-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {m.photoUrl ? (
                  <img
                    src={m.photoUrl}
                    alt={m.title}
                    className="h-12 w-12 flex-shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-lg">
                    📚
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{m.title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {m.author} · listed by {m.ownerName}
                  </p>
                </div>
                <span className="flex-shrink-0 text-sm font-semibold" style={{ color: accentColor }}>
                  {priceLabel(m.transactionType, m.askingPriceVnd)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        // No match -> gentle message plus the manual search link.
        <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
          No one has listed this book yet. Try a{" "}
          <Link href={searchHref} className="font-semibold text-blue-600 underline">
            search
          </Link>{" "}
          or be the first to share it.
        </p>
      )}
    </section>
  );
}

// Label for the listing's transaction type: GIFT, EXCHANGE, or a VND price.
function priceLabel(transactionType: string, askingPriceVnd: number | null): string {
  if (transactionType === "GIFT") return "Gift";
  if (transactionType === "EXCHANGE") return "Exchange";
  if (askingPriceVnd && askingPriceVnd > 0) {
    return `${askingPriceVnd.toLocaleString("en-US")} ₫`;
  }
  return "Free";
}
