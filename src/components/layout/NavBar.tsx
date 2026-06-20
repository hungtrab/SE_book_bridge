import Link from "next/link";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentUser } from "@/server/lib/auth-context";
import { hasModerationAccess } from "@/server/moderation/queue";
import { unreadNotificationCount } from "@/server/notifications/service";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function NavBar() {
  const user = await getCurrentUser();
  const [unread, canModerate] = user
    ? await Promise.all([unreadNotificationCount(user.id), hasModerationAccess(user)])
    : [0, false];

  return (
    <header className="nav-glass sticky top-0 z-40 border-b border-[color:var(--card-border)]">
      <nav className="nav-scroll flex w-full items-center gap-5 overflow-x-auto px-4 py-2.5 text-sm sm:px-6">
        <div className="flex shrink-0 items-center gap-4">
          <Link href="/" className="group flex items-center gap-2 font-bold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition-transform group-hover:-rotate-6 group-hover:scale-105">
              BB
            </span>
            <span>BookBridge</span>
          </Link>
          <span className="hidden h-6 w-px bg-slate-200 md:block" aria-hidden="true" />
          <Link href="/listings" className="link-soft">Listings</Link>
          <Link href="/search" className="link-soft">Search</Link>
          <Link href="/explore" className="link-soft">Explore</Link>
          <Link href="/communities" className="link-soft">Communities</Link>
        </div>

        <div
          className={
            user
              ? "ml-auto flex shrink-0 items-center gap-3 rounded-xl border border-slate-200/80 bg-white/75 px-3 py-1.5 shadow-sm 2xl:hidden"
              : "ml-auto flex shrink-0 items-center gap-3 rounded-xl border border-slate-200/80 bg-white/75 px-3 py-1.5 shadow-sm"
          }
        >
          {user ? (
            <>
              <Link href="/transactions" className="link-soft">My Txns</Link>
              <Link href="/messages" className="link-soft">Messages</Link>
              <Link href="/notifications" className="link-soft">
                Notifications{unread > 0 ? ` (${unread})` : ""}
              </Link>
              <Link href="/reports" className="link-soft">My Tickets</Link>
              {canModerate && <Link href="/moderation" className="link-soft">Moderation</Link>}
              {user.role === "ADMIN" && <Link href="/admin" className="link-soft">Admin</Link>}
              <Link href="/profile/sessions" className="link-soft">Sessions</Link>
              <span className="h-6 w-px bg-slate-200" aria-hidden="true" />
              <Link
                href={`/profile/${user.id}`}
                className="flex items-center gap-2 rounded-full border border-[color:var(--card-border)] bg-white py-1 pl-1 pr-3 font-semibold transition hover:border-blue-400 hover:text-blue-600"
              >
                <span className="grid size-7 place-items-center rounded-full bg-blue-600 text-[11px] font-black text-white">
                  {initials(user.displayName)}
                </span>
                {user.displayName}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="link-soft">Login</Link>
              <Link href="/register" className="btn-primary px-3 py-2">Register</Link>
            </>
          )}
        </div>
      </nav>
      {user && (
        <aside className="fixed bottom-0 right-0 top-[4.25rem] z-30 hidden w-[260px] flex-col border-l border-slate-200/80 bg-slate-50/90 p-4 text-sm shadow-[-10px_0_30px_rgba(15,23,42,0.05)] backdrop-blur-xl 2xl:flex">
          <Link
            href={`/profile/${user.id}`}
            className="flex items-center gap-3 border-b border-slate-200 pb-4"
          >
            <span className="grid size-10 place-items-center rounded-full bg-blue-600 text-xs font-black text-white shadow-md shadow-blue-600/20">
              {initials(user.displayName)}
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-gray-900">{user.displayName}</strong>
              <span className="text-xs text-gray-500">{user.role === "ADMIN" ? "Administrator" : "Member profile"}</span>
            </span>
          </Link>

          <nav aria-label="Account and management" className="mt-3 flex flex-col gap-1">
            <Link href="/transactions" className="right-rail-link">My transactions</Link>
            <Link href="/messages" className="right-rail-link">Messages</Link>
            <Link href="/notifications" className="right-rail-link">
              <span>Notifications</span>
              {unread > 0 && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">{unread}</span>}
            </Link>
            <Link href="/reports" className="right-rail-link">My tickets</Link>
            {canModerate && <Link href="/moderation" className="right-rail-link">Moderation</Link>}
            {user.role === "ADMIN" && <Link href="/admin" className="right-rail-link">Admin</Link>}
            <Link href="/profile/sessions" className="right-rail-link">Sessions</Link>
          </nav>

          <div className="mt-auto border-t border-slate-200 pt-3">
            <LogoutButton />
          </div>
        </aside>
      )}
    </header>
  );
}
