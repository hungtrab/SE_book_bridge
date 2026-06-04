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
    <div className="space-y-8">
      <section className="card-surface overflow-hidden rounded-3xl p-8 sm:p-10">
        <p className="badge-soft mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold">
          Community book exchange for campus life
        </p>
        <h1 className="hero-title max-w-3xl text-5xl font-black tracking-tight sm:text-6xl">Share books. Build trust. Keep stories moving.</h1>
        <p className="mt-4 max-w-2xl text-lg text-[color:var(--muted)]">
          Find second-hand books, follow trusted readers, request safely, and chat through each exchange.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/search" className="btn-primary px-5 py-3">Search books</Link>
          <Link href="/explore" className="rounded-xl border border-[color:var(--card-border)] px-5 py-3 font-semibold transition hover:border-blue-400 hover:text-blue-600">Explore communities</Link>
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
        <section className="card-surface rounded-2xl p-5">
          <p className="text-[color:var(--muted)]">
            <Link className="underline" href="/login">Sign in</Link> or{" "}
            <Link className="underline" href="/register">create an account</Link>{" "}
            to start sharing books.
          </p>
        </section>
      )}

    </div>
  );
}
