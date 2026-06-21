"use client";

import Link from "next/link";
import type { ReactNode } from "react";
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
import { useState } from "react";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { LiveMessagePanel } from "@/components/messaging/LiveMessagePanel";
import { LiveNotificationBell } from "@/components/notifications/LiveNotificationBell";

type OpenPanel = "messages" | "notifications" | "profile" | null;
type NavUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function NavLiveActions({
  user,
  initialUnread,
  initialUnreadMessages,
  canModerate,
}: {
  user: NavUser;
  initialUnread: number;
  initialUnreadMessages: number;
  canModerate: boolean;
}) {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);

  return (
    <>
      <LiveMessagePanel
        currentUserId={user.id}
        initialUnread={initialUnreadMessages}
        open={openPanel === "messages"}
        onOpenChange={(open) => setOpenPanel(open ? "messages" : null)}
      />
      <LiveNotificationBell
        initialUnread={initialUnread}
        open={openPanel === "notifications"}
        onOpenChange={(open) => setOpenPanel(open ? "notifications" : null)}
      />
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenPanel(openPanel === "profile" ? null : "profile")}
          className="flex h-11 cursor-pointer list-none items-center gap-1 rounded-full p-0.5 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
          aria-label="Open account menu"
          aria-expanded={openPanel === "profile"}
          title="Account"
        >
          <span className="grid size-10 place-items-center overflow-hidden rounded-full bg-blue-600 text-xs font-black text-white shadow-md shadow-blue-600/20">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(user.displayName)
            )}
          </span>
          <ChevronDown
            size={16}
            className={`hidden text-slate-500 transition-transform sm:block ${openPanel === "profile" ? "rotate-180" : ""}`}
          />
        </button>

        {openPanel === "profile" && (
          <section className="nav-live-panel account-live-panel">
            <Link
              href={`/profile/${user.id}`}
              onClick={() => setOpenPanel(null)}
              className="flex items-center gap-3 rounded-md p-3 transition hover:bg-slate-100"
            >
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
              <AccountLink href="/profile/edit" onNavigate={() => setOpenPanel(null)} icon={<Settings size={19} />} label="Edit profile" />
              <AccountLink href="/transactions" onNavigate={() => setOpenPanel(null)} icon={<ArrowLeftRight size={19} />} label="My transactions" />
              <AccountLink href="/reports" onNavigate={() => setOpenPanel(null)} icon={<TicketCheck size={19} />} label="My tickets" />
              {canModerate && (
                <AccountLink href="/moderation" onNavigate={() => setOpenPanel(null)} icon={<ShieldCheck size={19} />} label="Moderation" />
              )}
              {user.role === "ADMIN" && (
                <AccountLink href="/admin" onNavigate={() => setOpenPanel(null)} icon={<LayoutDashboard size={19} />} label="Admin" />
              )}
              <AccountLink href="/profile/sessions" onNavigate={() => setOpenPanel(null)} icon={<MonitorSmartphone size={19} />} label="Sessions" />
              <AccountLink href={`/profile/${user.id}`} onNavigate={() => setOpenPanel(null)} icon={<UserRound size={19} />} label="Profile" className="md:hidden" />
            </nav>

            <div className="my-2 h-px bg-slate-200" />
            <LogoutButton className="account-menu-link w-full" />
          </section>
        )}
      </div>
    </>
  );
}

function AccountLink({
  href,
  icon,
  label,
  onNavigate,
  className = "",
}: {
  href: string;
  icon: ReactNode;
  label: string;
  onNavigate: () => void;
  className?: string;
}) {
  return (
    <Link href={href} onClick={onNavigate} className={`account-menu-link ${className}`}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}
