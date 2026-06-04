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
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold">BookBridge</h1>
        <p className="text-[color:var(--muted)] mt-1">
          Community-based platform for second-hand book sharing.
        </p>
      </section>

      {user ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Hi, {user.displayName}.</h2>
          <p className="mt-1">
            Browse <Link className="underline" href="/listings">listings</Link>,
            check your <Link className="underline" href="/transactions">transactions</Link>,
            or visit your <Link className="underline" href={`/profile/${user.id}`}>profile</Link>.
          </p>
          <h2 className="text-xl font-semibold">Your feed</h2>
          <FeedList initial={feed?.items ?? []} />
        </section>
      ) : (
        <section>
          <p>
            <Link className="underline" href="/login">Sign in</Link> or{" "}
            <Link className="underline" href="/register">create an account</Link>{" "}
            to start sharing books.
          </p>
        </section>
      )}

    </div>
  );
}
