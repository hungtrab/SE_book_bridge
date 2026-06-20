import Link from "next/link";

import { getCurrentUser } from "@/server/lib/auth-context";
import { unreadNotificationCount } from "@/server/notifications/service";
import { hasModerationAccess } from "@/server/moderation/queue";
import { LogoutButton } from "@/components/auth/LogoutButton";

export async function NavBar() {
  const user = await getCurrentUser();
  const [unread, canModerate] = user
    ? await Promise.all([unreadNotificationCount(user.id), hasModerationAccess(user)])
    : [0, false];
  return (
    <header className="nav-glass sticky top-0 z-40 border-b border-[color:var(--card-border)]">
      <nav className="mx-auto flex max-w-6xl items-center gap-4 overflow-x-auto px-4 py-3 text-sm sm:px-6">
        <Link href="/" className="group flex items-center gap-2 font-bold tracking-tight">
          <span className="grid size-8 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25 transition-transform group-hover:-rotate-6 group-hover:scale-105">📚</span>
          <span>BookBridge</span>
        </Link>
        <Link href="/listings" className="link-soft">Listings</Link>
        <Link href="/search" className="link-soft">Search</Link>
        <Link href="/explore" className="link-soft">Explore</Link>
        <Link href="/communities" className="link-soft">Communities</Link>
        <Link href="/bulletins" className="link-soft">Book Bulletins</Link>
        <span className="ml-auto flex shrink-0 items-center gap-3">
          {user ? (
            <>
              <Link href="/transactions" className="link-soft">My Txns</Link>
              <Link href="/messages" className="link-soft">Messages</Link>
              <Link href="/notifications" className="link-soft">Notifications{unread > 0 ? ` (${unread})` : ""}</Link>
              <Link href="/reports" className="link-soft">My Tickets</Link>
              {canModerate && <Link href="/moderation" className="link-soft">Moderation</Link>}
              {user.role === "ADMIN" && <Link href="/admin" className="link-soft">Admin</Link>}
              <Link href="/profile/sessions" className="link-soft">Sessions</Link>
              <Link href={`/profile/${user.id}`} className="rounded-full border border-[color:var(--card-border)] px-3 py-1 font-semibold transition hover:border-blue-400 hover:text-blue-600">{user.displayName}</Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="link-soft">Login</Link>
              <Link href="/register" className="btn-primary px-3 py-2">Register</Link>
            </>
          )}
        </span>
      </nav>
    </header>
  );
}
