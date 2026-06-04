"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { presentNotification } from "@/lib/notifications/presentation";

type NotificationRow = {
  id: string;
  kind: string;
  payload: unknown;
  readAt: string | Date | null;
  createdAt: string | Date;
};

export function NotificationList({ initial }: { initial: NotificationRow[] }) {
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let polling = false;
    let after = latestCreatedAt(initial);

    function addNotification(notification: NotificationRow) {
      after = maxDate(after, notification.createdAt);
      setItems((current) => current.some((row) => row.id === notification.id)
        ? current
        : [notification, ...current]);
    }

    async function longPoll() {
      if (polling) return;
      polling = true;
      setError("Realtime connection interrupted; using long-polling fallback.");
      while (!cancelled) {
        const res = await fetch(`/api/notifications?wait=1&after=${encodeURIComponent(after.toISOString())}`).catch(() => null);
        if (!res?.ok) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          continue;
        }
        const body = await res.json().catch(() => ({ items: [] }));
        for (const notification of (body.items ?? []) as NotificationRow[]) addNotification(notification);
      }
    }

    if (typeof EventSource === "undefined") {
      void longPoll();
      return () => { cancelled = true; };
    }

    const source = new EventSource("/api/notifications/stream");
    source.addEventListener("notification", (event) => {
      const notification = JSON.parse((event as MessageEvent).data) as NotificationRow;
      addNotification(notification);
    });
    source.onerror = () => {
      source.close();
      void longPoll();
    };
    source.onopen = () => setError(null);
    return () => {
      cancelled = true;
      source.close();
    };
  }, []);

  async function markRead(id: string) {
    const res = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    if (!res.ok) {
      setError("Could not mark notification read");
      return;
    }
    setItems((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-amber-700">{error}</p>}
      {items.length === 0 ? <p>No notifications yet.</p> : items.map((item) => (
        <article key={item.id} className={`rounded border p-3 ${item.readAt ? "opacity-60" : "border-blue-400"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <NotificationText item={item} />
              <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
            {!item.readAt && (
              <button type="button" onClick={() => markRead(item.id)} className="rounded border px-2 py-1 text-xs">
                Mark read
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function NotificationText({ item }: { item: NotificationRow }) {
  const notification = presentNotification(item.kind, item.payload);
  const content = (
    <>
      <h2 className="font-semibold">{notification.title}</h2>
      <p className="text-sm text-gray-600">{notification.body}</p>
    </>
  );
  return notification.href
    ? <Link href={notification.href} className="block hover:text-blue-600">{content}</Link>
    : content;
}

function latestCreatedAt(items: NotificationRow[]) {
  return items.reduce((latest, item) => maxDate(latest, item.createdAt), new Date());
}

function maxDate(left: Date, right: string | Date) {
  const rightDate = new Date(right);
  return rightDate > left ? rightDate : left;
}
