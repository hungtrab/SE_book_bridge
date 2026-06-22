import Link from "next/link";

import { findListingsForBook } from "@/server/listings/book-match";

// Async server component for the Artifacts "See this book on listing" feature.
// Outside (always visible): a short teaser about a real offer, e.g.
//   "Dr Do is gifting The AIchemist".
// Clicking "See this book on listing" expands a native <details> to reveal ALL
// users offering this book (gift / exchange / sell). Fuzzy matching means
// "The Alchemist" still finds a listing posted as "The AIchemist".
export async function ArtifactListingLink({
  title,
  accentColor,
}: {
  title: string;
  accentColor: string;
}) {
  const matches = await findListingsForBook(title);
  const searchHref = `/listings?${new URLSearchParams({ q: title }).toString()}`;
  const top = matches[0];

  return (
    <section
      id="artifact-listings"
      className="mx-auto mt-6 max-w-4xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      {/* <details> wraps everything; <summary> (the always-visible header +
          button) must be the direct first child so it toggles the list below. */}
      <details className="group">
        <summary className="flex cursor-pointer select-none list-none flex-wrap items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <div>
            <p className="text-sm font-semibold text-blue-600">Book listing</p>
            <h2 className="text-lg font-black text-slate-900">Want the physical book?</h2>
            {/* Teaser — always visible, summarises the top offer. */}
            <p className="text-sm text-slate-500">
              {top
                ? `${top.ownerName} is ${offerVerb(top.transactionType)} ${top.title}` +
                  (matches.length > 1 ? ` · +${matches.length - 1} more` : "")
                : "No one has listed this book yet."}
            </p>
          </div>
          {/* Styled like a button; the whole summary is the click target. */}
          <span
            className="rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition-transform group-hover:-translate-y-0.5"
            style={{ background: accentColor }}
          >
            See this book on listing
          </span>
        </summary>

        {/* Revealed on click: everyone offering this book. */}
        <div className="mt-4 border-t border-slate-100 pt-2">
          {matches.length > 0 ? (
            <ul className="divide-y divide-slate-100">
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
                    <span
                      className="flex-shrink-0 text-sm font-semibold"
                      style={{ color: accentColor }}
                    >
                      {offerLabel(m.transactionType, m.askingPriceVnd)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-3 text-sm text-slate-500">
              No one has listed this book yet. Try a{" "}
              <Link href={searchHref} className="font-semibold text-blue-600 underline">
                search
              </Link>{" "}
              or be the first to share it.
            </p>
          )}
        </div>
      </details>
    </section>
  );
}

// Verb for the teaser line based on how the owner is offering the book.
function offerVerb(transactionType: string): string {
  if (transactionType === "GIFT") return "gifting";
  if (transactionType === "EXCHANGE") return "exchanging";
  return "selling";
}

// Label for a listing row: GIFT, EXCHANGE, a VND price, or Free.
function offerLabel(transactionType: string, askingPriceVnd: number | null): string {
  if (transactionType === "GIFT") return "Gift";
  if (transactionType === "EXCHANGE") return "Exchange";
  if (askingPriceVnd && askingPriceVnd > 0) {
    return `${askingPriceVnd.toLocaleString("en-US")} ₫`;
  }
  return "Free";
}
