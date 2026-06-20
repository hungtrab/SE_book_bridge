"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type NotificationEvent = {
  id: string;
  readAt: string | null;
};

export function LiveNotificationBell({ initialUnread }: { initialUnread: number }) {
  const [unread, setUnread] = useState(initialUnread);
  const received = useRef(new Set<string>());

  useEffect(() => {
    if (typeof EventSource === "undefined") return;

    const source = new EventSource("/api/notifications/stream");
    source.addEventListener("notification", (event) => {
      const notification = JSON.parse((event as MessageEvent).data) as NotificationEvent;
      if (notification.readAt || received.current.has(notification.id)) return;
      received.current.add(notification.id);
      setUnread((current) => current + 1);
    });
    return () => source.close();
  }, []);

  return (
    <Link
      href="/notifications"
      className="nav-icon-button relative"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      title="Notifications"
    >
      <Bell size={20} strokeWidth={2.2} />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-black leading-none text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
