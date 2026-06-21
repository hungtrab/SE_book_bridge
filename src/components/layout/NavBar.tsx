import Link from "next/link";
import {
  ArrowLeftRight,
  ChevronDown,
  LayoutDashboard,
  MonitorSmartphone,
  Settings,
  ShieldCheck,
  TicketCheck,
  UserRound,
} from "lucide-react";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { LiveMessagePanel } from "@/components/messaging/LiveMessagePanel";
import { LiveNotificationBell } from "@/components/notifications/LiveNotificationBell";
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
            <>
              <LiveMessagePanel currentUserId={user.id} />
              <LiveNotificationBell initialUnread={unread} />

              <details className="account-menu group relative">
                <summary className="flex h-11 cursor-pointer list-none items-center gap-1 rounded-full p-0.5 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
                  <span className="grid size-10 place-items-center overflow-hidden rounded-full bg-blue-600 text-xs font-black text-white shadow-md shadow-blue-600/20">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials(user.displayName)
                    )}
                  </span>
                  <ChevronDown size={16} className="hidden text-slate-500 transition-transform group-open:rotate-180 sm:block" />
                  <span className="sr-only">Open account menu</span>
                </summary>

                <div className="absolute right-0 top-[calc(100%+0.65rem)] w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/15">
                  <Link href={`/profile/${user.id}`} className="flex items-center gap-3 rounded-md p-3 transition hover:bg-slate-100">
                    <span className="grid size-11 flex-none place-items-center overflow-hidden rounded-full bg-blue-600 text-xs font-black text-white">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials(user.displayName)
                      )}
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-sm text-slate-900">{user.displayName}</strong>
                      <span className="block text-xs text-slate-500">
                        {user.role === "ADMIN" ? "Administrator" : "View your profile"}
                      </span>
                    </span>
                  </Link>

                  <div className="my-2 h-px bg-slate-200" />
                  <nav aria-label="Account and management" className="space-y-1">
                    <Link href="/profile/edit" className="account-menu-link">
                      <Settings size={19} />
                      <span>Edit profile</span>
                    </Link>
                    <Link href="/transactions" className="account-menu-link">
                      <ArrowLeftRight size={19} />
                      <span>My transactions</span>
                    </Link>
                    <Link href="/reports" className="account-menu-link">
                      <TicketCheck size={19} />
                      <span>My tickets</span>
                    </Link>
                    {canModerate && (
                      <Link href="/moderation" className="account-menu-link">
                        <ShieldCheck size={19} />
                        <span>Moderation</span>
                      </Link>
                    )}
                    {user.role === "ADMIN" && (
                      <Link href="/admin" className="account-menu-link">
                        <LayoutDashboard size={19} />
                        <span>Admin</span>
                      </Link>
                    )}
                    <Link href="/profile/sessions" className="account-menu-link">
                      <MonitorSmartphone size={19} />
                      <span>Sessions</span>
                    </Link>
                    <Link href={`/profile/${user.id}`} className="account-menu-link md:hidden">
                      <UserRound size={19} />
                      <span>Profile</span>
                    </Link>
                  </nav>

                  <div className="my-2 h-px bg-slate-200" />
                  <LogoutButton className="account-menu-link w-full" />
                </div>
              </details>
            </>
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
