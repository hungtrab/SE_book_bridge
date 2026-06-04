"use client";

import { useEffect, useState } from "react";

type SessionRow = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/users/me/sessions");
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Could not load sessions");
      return;
    }
    setSessions(body.sessions ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function revoke(id: string) {
    const res = await fetch(`/api/users/me/sessions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not revoke session");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Active sessions</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {sessions.length === 0 ? (
        <p className="text-sm text-gray-600">No active sessions.</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="rounded border p-3">
              <p className="font-mono text-xs">{session.id}</p>
              <p className="text-sm">IP: {session.ipAddress ?? "unknown"}</p>
              <p className="truncate text-sm">User agent: {session.userAgent ?? "unknown"}</p>
              <p className="text-xs text-gray-600">
                Last seen: {new Date(session.lastSeenAt).toLocaleString()}
              </p>
              <button
                onClick={() => revoke(session.id)}
                className="mt-2 rounded bg-gray-800 px-3 py-1 text-sm text-white"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
