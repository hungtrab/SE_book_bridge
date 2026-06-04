import Link from "next/link";

import { getCurrentUser } from "@/server/lib/auth-context";
import { unreadNotificationCount } from "@/server/notifications/service";
import { hasModerationAccess } from "@/server/moderation/queue";

export async function NavBar() {
  const user = await getCurrentUser();
  const [unread, canModerate] = user
    ? await Promise.all([unreadNotificationCount(user.id), hasModerationAccess(user)])
    : [0, false];
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <nav className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4 text-sm">
        <Link href="/" className="font-semibold">📚 BookBridge</Link>
        <Link href="/listings">Listings</Link>
        <Link href="/search">Search</Link>
        <Link href="/explore">Explore</Link>
        <Link href="/communities">Communities</Link>
        <span className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <Link href="/transactions">My Txns</Link>
              <Link href="/messages">Messages</Link>
              <Link href="/notifications">Notifications{unread > 0 ? ` (${unread})` : ""}</Link>
              <Link href="/reports">My Reports</Link>
              {canModerate && <Link href="/moderation">Moderation</Link>}
              {user.role === "ADMIN" && <Link href="/admin">Admin</Link>}
              <Link href="/profile/sessions">Sessions</Link>
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
