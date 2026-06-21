import Link from "next/link";

import { NavLiveActions } from "@/components/layout/NavLiveActions";
import { getCurrentUser } from "@/server/lib/auth-context";
import { unreadMessageCount } from "@/server/messaging/service";
import { hasModerationAccess } from "@/server/moderation/queue";
import { unreadNotificationCount } from "@/server/notifications/service";

export async function NavBar() {
  const user = await getCurrentUser();
  const [unread, unreadMessages, canModerate] = user
    ? await Promise.all([
        unreadNotificationCount(user.id),
        unreadMessageCount(user.id),
        hasModerationAccess(user),
      ])
    : [0, 0, false];

  return (
    <header className="nav-glass sticky top-0 z-40 border-b border-[color:var(--card-border)]">
      <nav className="flex h-16 w-full items-center gap-3 overflow-visible px-3 text-sm sm:px-5">
        <div className="flex min-w-0 shrink-0 items-center gap-4">
          <Link href="/" className="group flex items-center gap-2 font-bold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition-transform group-hover:-rotate-6 group-hover:scale-105">
              BB
            </span>
            <span className="hidden sm:inline">BookBridge</span>
          </Link>
          <div className="hidden items-center gap-4 md:flex">
            <span className="h-6 w-px bg-slate-200" aria-hidden="true" />
            <Link href="/search" className="link-soft">Search</Link>
            <Link href="/communities" className="link-soft">Communities</Link>
            <Link href="/artifacts" className="link-soft">Artifacts</Link>
            <Link href="/explore" className="link-soft">Explore</Link>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {user ? (
            <NavLiveActions
              user={{
                id: user.id,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                role: user.role,
              }}
              initialUnread={unread}
              initialUnreadMessages={unreadMessages}
              canModerate={canModerate}
            />
          ) : (
            <>
              <Link href="/login" className="link-soft">Login</Link>
              <Link href="/register" className="btn-primary px-3 py-2">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
