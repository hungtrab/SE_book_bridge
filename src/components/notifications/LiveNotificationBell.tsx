"use client";

import { Bell, Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { presentNotification } from "@/lib/notifications/presentation";

type NotificationRow = {
  id: string;
  kind: string;
  payload: unknown;
  readAt: string | null;
  createdAt: string;
};

type LiveNotificationBellProps = {
  initialUnread: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LiveNotificationBell({ initialUnread, open, onOpenChange }: LiveNotificationBellProps) {
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [error, setError] = useState("");
  const received = useRef(new Set<string>());

  useEffect(() => {
    if (!open) return;
    setError("");
    fetch("/api/notifications")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Could not load notifications");
        setItems(data.items ?? []);
        setUnread(data.unreadCount ?? 0);
      })
      .catch((requestError: Error) => setError(requestError.message));
  }, [open]);

  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    const source = new EventSource("/api/notifications/stream");
    source.addEventListener("notification", (event) => {
      const notification = JSON.parse((event as MessageEvent).data) as NotificationRow;
      if (received.current.has(notification.id)) return;
      received.current.add(notification.id);
      setItems((current) => current.some((item) => item.id === notification.id) ? current : [notification, ...current]);
      if (!notification.readAt) setUnread((current) => current + 1);
    });
    source.addEventListener("error", () => setError("Live notification updates are temporarily unavailable."));
    return () => source.close();
  }, []);

  async function markRead(id: string) {
    const res = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    if (!res.ok) {
      const out = await res.json().catch(() => ({}));
      setError(out.error ?? "Could not update the notification");
      return;
    }
    setItems((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
    setUnread((current) => Math.max(0, current - 1));
    setError("");
  }

  function markReadInState(id: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
    setUnread((current) => Math.max(0, current - 1));
  }

  function handleNotificationClick(item: NotificationRow) {
    if (!item.readAt) {
      markReadInState(item.id);
      void fetch(`/api/notifications/${item.id}/read`, { method: "POST" });
    }
    onOpenChange(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="nav-icon-button relative"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        title="Notifications"
      >
        <Bell size={20} strokeWidth={2.2} />
        {unread > 0 && <span className="nav-count-badge">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <section className="nav-live-panel">
          <header className="flex items-center justify-between border-b border-slate-200 p-4">
            <h2 className="text-lg font-black">Notifications</h2>
            <span className="text-xs font-semibold text-slate-500">{unread} unread</span>
          </header>
          <div className="max-h-[32rem] overflow-y-auto p-2">
            {items.map((item) => {
              const view = presentNotification(item.kind, item.payload);
              const content = (
                <>
                  <h3 className="text-sm font-bold">{view.title}</h3>
                  <p className="mt-0.5 text-xs leading-5 text-slate-600">{view.body}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                </>
              );
              return (
                <article key={item.id} className={`rounded-md p-3 ${item.readAt ? "opacity-60" : "bg-blue-50"}`}>
                  <div className="flex items-start gap-2">
                    {view.href ? (
                      <Link
                        href={view.href}
                        onClick={() => handleNotificationClick(item)}
                        className="min-w-0 flex-1 rounded-sm hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="min-w-0 flex-1">{content}</div>
                    )}
                    {!item.readAt && (
                      <button type="button" onClick={() => markRead(item.id)} className="nav-panel-icon" title="Mark read" aria-label="Mark notification read">
                        <Check size={15} />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
            {items.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No notifications yet.</p>}
          </div>
          {error && (
            <p role="alert" className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">
              {error}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
