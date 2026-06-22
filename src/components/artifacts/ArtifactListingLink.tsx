import Link from "next/link";

export function ArtifactListingLink({
  title,
  accentColor,
}: {
  title: string;
  accentColor: string;
}) {
  const href = `/listings?${new URLSearchParams({ q: title }).toString()}`;

  return (
    <section className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-blue-600">Book listing</p>
        <h2 className="text-lg font-black text-slate-900">Want the physical book?</h2>
        <p className="text-sm text-slate-500">Search marketplace listings for {title}.</p>
      </div>
      <Link
        href={href}
        className="rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5"
        style={{ background: accentColor }}
      >
        See this book on listing
      </Link>
    </section>
  );
}
