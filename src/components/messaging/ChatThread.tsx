"use client";

import { useEffect, useRef, useState } from "react";

import { ReportButton } from "@/components/moderation/ReportButton";

type Msg = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; displayName: string };
};

function mergeMessages(current: Msg[], incoming: Msg[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function ChatThread({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const lastMessageAtRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    lastMessageAtRef.current = messages.at(-1)?.createdAt ?? null;
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    async function loadMessages(after?: string | null) {
      const params = after ? `?after=${encodeURIComponent(after)}` : "";
      const response = await fetch(`/api/conversations/${conversationId}/messages${params}`, {
        cache: "no-store",
      });
      const out = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(out.error ?? "Could not load messages");
      if (!cancelled) {
        setMessages((current) => mergeMessages(current, out.messages ?? []));
        setError(null);
      }
    }

    loadMessages().catch((err) => setError(err instanceof Error ? err.message : "Could not load messages"));

    const source = new EventSource(`/api/conversations/${conversationId}/stream`);
    source.addEventListener("message", (event) => {
      try {
        const message = JSON.parse((event as MessageEvent).data) as Msg;
        setMessages((current) => mergeMessages(current, [message]));
        setError(null);
      } catch {
        setError("Could not read a live message");
      }
    });
    source.addEventListener("error", () => {
      setError("Live updates paused. Retrying...");
    });

    const fallback = window.setInterval(() => {
      loadMessages(lastMessageAtRef.current).catch(() => {
        if (!cancelled) setError("Could not refresh messages");
      });
    }, 2500);

    return () => {
      cancelled = true;
      source.close();
      window.clearInterval(fallback);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;

    const response = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    const out = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(out.error ?? "Send failed");
      return;
    }
    setMessages((current) => mergeMessages(current, [out]));
    setBody("");
    setError(null);
  }

  return (
    <div className="space-y-3">
      <div className="max-h-[60vh] space-y-2 overflow-y-auto rounded border p-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded p-2 ${
              message.sender.id === currentUserId
                ? "ml-10 bg-blue-100 text-black"
                : "mr-10 bg-gray-100 text-black"
            }`}
          >
            <p className="text-xs font-semibold">{message.sender.displayName}</p>
            <p>{message.body}</p>
            <p className="text-xs text-gray-500">{new Date(message.createdAt).toLocaleString()}</p>
            {message.sender.id !== currentUserId && (
              <ReportButton targetType="MESSAGE" targetId={message.id} />
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input
          required
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="flex-1 rounded border px-2 py-1"
          placeholder="Write a message"
        />
        <button className="rounded bg-blue-600 px-3 py-2 text-white">Send</button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
