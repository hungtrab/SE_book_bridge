import Link from "next/link";

import { getCurrentUser } from "@/server/lib/auth-context";

export async function NavBar() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <nav className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4 text-sm">
        <Link href="/" className="font-semibold">📚 BookBridge</Link>
        <Link href="/listings">Listings</Link>
        <Link href="/search">Search</Link>
        <Link href="/communities">Communities</Link>
        <span className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <Link href="/transactions">My Txns</Link>
              <Link href="/messages">Messages</Link>
              <Link href={`/profile/${user.id}`}>{user.displayName}</Link>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register" className="px-2 py-1 rounded bg-blue-600 text-white">Register</Link>
            </>
          )}
        </span>
      </nav>
    </header>
  );
}
