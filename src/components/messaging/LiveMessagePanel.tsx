"use client";

import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { useEffect, useState } from "react";

type Conversation = {
  id: string;
  userAId: string;
  userBId: string;
  userA: { id: string; displayName: string; avatarUrl: string | null };
  userB: { id: string; displayName: string; avatarUrl: string | null };
  transaction: { listing: { title: string } } | null;
  messages: Array<{ body: string }>;
};

type Message = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; displayName: string };
};

export function LiveMessagePanel({ currentUserId }: { currentUserId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/conversations").then((res) => res.json()).then((data) => setItems(data.items ?? []));
  }, [open]);

  useEffect(() => {
    if (!active) return;
    fetch(`/api/conversations/${active.id}/messages`)
      .then((res) => res.json())
      .then((data) => setMessages(data.messages ?? []));
    const source = new EventSource(`/api/conversations/${active.id}/stream`);
    source.addEventListener("message", (event) => {
      const message = JSON.parse((event as MessageEvent).data) as Message;
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
    });
    return () => source.close();
  }, [active]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!active || !body.trim()) return;
    const res = await fetch(`/api/conversations/${active.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok) {
      setMessages((current) => current.some((item) => item.id === out.id) ? current : [...current, out]);
      setBody("");
    }
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="nav-icon-button" aria-label="Messages" title="Messages">
        <MessageCircle size={20} strokeWidth={2.2} />
      </button>
      {open && (
        <section className="nav-live-panel">
          {active ? (
            <>
              <header className="flex items-center gap-2 border-b border-slate-200 p-3">
                <button type="button" onClick={() => setActive(null)} className="nav-panel-icon" aria-label="Back to conversations"><ArrowLeft size={18} /></button>
                <div>
                  <h2 className="font-black">{otherUser(active, currentUserId).displayName}</h2>
                  <p className="text-xs text-slate-500">{active.transaction?.listing.title ?? "Direct conversation"}</p>
                </div>
              </header>
              <div className="nav-message-scroll">
                {messages.map((message) => (
                  <div key={message.id} className={`nav-message ${message.sender.id === currentUserId ? "is-mine" : ""}`}>
                    <p>{message.body}</p>
                    <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                ))}
                {messages.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No messages yet.</p>}
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
                <input value={body} onChange={(event) => setBody(event.target.value)} className="field" placeholder="Write a message" />
                <button className="nav-panel-icon bg-blue-600 text-white" aria-label="Send message"><Send size={17} /></button>
              </form>
            </>
          ) : (
            <>
              <header className="border-b border-slate-200 p-4"><h2 className="text-lg font-black">Messages</h2></header>
              <div className="max-h-[28rem] overflow-y-auto p-2">
                {items.map((conversation) => {
                  const other = otherUser(conversation, currentUserId);
                  return (
                    <button key={conversation.id} type="button" onClick={() => setActive(conversation)} className="flex w-full items-center gap-3 rounded-md p-3 text-left hover:bg-slate-100">
                      <span className="grid size-10 flex-none place-items-center overflow-hidden rounded-full bg-blue-600 text-xs font-black text-white">
                        {other.avatarUrl ? <img src={other.avatarUrl} alt="" className="h-full w-full object-cover" /> : other.displayName.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <strong className="block truncate text-sm">{other.displayName}</strong>
                        <span className="block truncate text-xs text-slate-500">{conversation.messages[0]?.body ?? "Open conversation"}</span>
                      </span>
                    </button>
                  );
                })}
                {items.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No conversations yet.</p>}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function otherUser(conversation: Conversation, currentUserId: string) {
  return conversation.userAId === currentUserId ? conversation.userB : conversation.userA;
}
