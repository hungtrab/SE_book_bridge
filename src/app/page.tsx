import Link from "next/link";

import { getCurrentUser } from "@/server/lib/auth-context";
import { FeedList } from "@/components/feed/FeedList";
import { listFeed, syncFeedForUser } from "@/server/feed/service";

export default async function HomePage() {
  const user = await getCurrentUser();
  const feed = user
    ? await syncFeedForUser(user.id).then(() => listFeed(user.id))
    : null;
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-[color:var(--card-border)] bg-slate-950 px-6 py-12 text-white shadow-2xl shadow-slate-950/20 sm:px-10 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.35),transparent_32rem),radial-gradient(circle_at_85%_30%,rgba(16,185,129,0.18),transparent_24rem)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
              Community book exchange for campus life
            </p>
            <h1 className="max-w-3xl text-5xl font-black tracking-tight text-white sm:text-6xl">
              Share books. Build trust. Keep stories moving.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              BookBridge helps students and local readers find second-hand books, request safely, chat with owners, and grow reputation through completed exchanges.
            </p>
            <form action="/search" className="mt-7 flex max-w-2xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-2 backdrop-blur sm:flex-row">
              <input
                name="q"
                placeholder="Search by title, author, or ISBN..."
                className="min-h-12 flex-1 rounded-xl border-white/10 bg-white px-4 text-slate-950 placeholder:text-slate-500"
              />
              <button className="btn-primary min-h-12 px-5">Search books</button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-white/10 px-3 py-1">10 demo listings</span>
              <span className="rounded-full border border-white/10 px-3 py-1">5 communities</span>
              <span className="rounded-full border border-white/10 px-3 py-1">Trusted transactions</span>
            </div>
          </div>
          <div className="relative min-h-[360px]">
            <div className="absolute right-6 top-0 w-72 rotate-3 rounded-3xl border border-white/10 bg-white p-4 text-slate-950 shadow-2xl">
              <div className="h-40 rounded-2xl bg-gradient-to-br from-indigo-100 to-emerald-100" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-indigo-600">Gift</p>
              <h3 className="text-xl font-bold">Sapiens</h3>
              <p className="text-sm text-slate-500">Yuval Noah Harari</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">GOOD</span>
                <span className="text-sm font-semibold">Alice Nguyen</span>
              </div>
            </div>
            <div className="absolute left-0 top-24 w-72 -rotate-6 rounded-3xl border border-white/10 bg-slate-900 p-4 shadow-2xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">Transaction</p>
              <h3 className="mt-2 text-xl font-bold text-white">Request accepted</h3>
              <div className="mt-5 space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-3"><span className="size-2 rounded-full bg-emerald-400" />Listing reserved</div>
                <div className="flex items-center gap-3"><span className="size-2 rounded-full bg-indigo-400" />Conversation opened</div>
                <div className="flex items-center gap-3"><span className="size-2 rounded-full bg-amber-400" />Reputation protected</div>
              </div>
            </div>
            <div className="absolute bottom-2 right-0 w-64 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-sm font-semibold text-slate-900">Community feed</p>
              <p className="mt-1 text-sm text-slate-800">Follow readers and see new books in real time.</p>
            </div>
          </div>
        </div>
      </section>

      {user ? (
        <section className="space-y-4">
          <div className="card-surface rounded-2xl p-5">
            <h2 className="text-xl font-semibold">Hi, {user.displayName}.</h2>
            <p className="mt-1 text-[color:var(--muted)]">
            Browse <Link className="underline" href="/listings">listings</Link>,
            check your <Link className="underline" href="/transactions">transactions</Link>,
            or visit your <Link className="underline" href={`/profile/${user.id}`}>profile</Link>.
            </p>
          </div>
          <h2 className="text-xl font-semibold">Your feed</h2>
          <FeedList initial={feed?.items ?? []} />
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["List books", "Create clean listings with photos, condition, type, and symbolic pricing."],
            ["Exchange safely", "Request, accept, chat, ship, complete, rate, and dispute with audit logs."],
            ["Build trust", "Reputation tiers, moderator tickets, communities, and notifications keep the platform healthy."],
          ].map(([title, body]) => (
            <article key={title} className="card-surface interactive-card rounded-2xl p-5">
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{body}</p>
            </article>
          ))}
        </section>
      )}

    </div>
  );
}
