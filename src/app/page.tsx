import Link from "next/link";

import { getCurrentUser } from "@/server/lib/auth-context";

export default async function HomePage() {
  const user = await getCurrentUser();
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold">BookBridge</h1>
        <p className="text-[color:var(--muted)] mt-1">
          Community-based platform for second-hand book sharing.
        </p>
      </section>

      {user ? (
        <section>
          <h2 className="text-xl font-semibold">Hi, {user.displayName}.</h2>
          <p className="mt-1">
            Browse <Link className="underline" href="/listings">listings</Link>,
            check your <Link className="underline" href="/transactions">transactions</Link>,
            or visit your <Link className="underline" href={`/profile/${user.id}`}>profile</Link>.
          </p>
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

      <section className="text-sm text-[color:var(--muted)]">
        TODO (Person 3): personalised feed of new listings from followed users
        and joined sub-communities. See{" "}
        <code>src/server/feed/service.ts</code> and{" "}
        <code>docs/TASKS.md</code> §3.
      </section>
    </div>
  );
}
